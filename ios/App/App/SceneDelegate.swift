import UIKit
import Capacitor
import WebKit
import StoreKit
import UserNotifications

final class PingCarViewController: CAPBridgeViewController, WKScriptMessageHandler {

    private var backButton: UIButton!
    private var webViewObservation: NSKeyValueObservation!
    private weak var iapWebView: WKWebView?
    private weak var pushWebView: WKWebView?
    private var pushObservers: [NSObjectProtocol] = []
    private let iapProductIDs = [
        "ch.pingcar.premium.monthly",
        "ch.pingcar.premium.yearly"
    ]

    override func viewDidLoad() {
        super.viewDidLoad()

        setupBackButton()

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.registerQRShareHandler()
            self.registerIAPHandler()
            self.registerPushHandler()
            self.setupWebViewObservation()
            self.enableBackSwipe()
        }
    }

    private func findWebView(in view: UIView) -> WKWebView? {
        if let webView = view as? WKWebView {
            return webView
        }

        for subview in view.subviews {
            if let webView = findWebView(in: subview) {
                return webView
            }
        }

        return nil
    }

    private func registerQRShareHandler() {
        guard let webView = findWebView(in: view) else {
            return
        }

        webView.configuration.userContentController.add(
            self,
            name: "pingcarShareQR"
        )
    }

    private func registerIAPHandler() {
        guard let webView = findWebView(in: view) else { return }
        iapWebView = webView
        webView.configuration.userContentController.add(self, name: "pingcarIAP")
    }

    private func registerPushHandler() {
        guard let webView = findWebView(in: view) else { return }
        pushWebView = webView
        webView.configuration.userContentController.add(self, name: "pingcarPush")

        let center = NotificationCenter.default
        pushObservers.append(center.addObserver(
            forName: Notification.Name("PingCarAPNsTokenReceived"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let token = notification.userInfo?["token"] as? String else { return }
            self?.sendPushEvent("pingcar-push-token", detail: ["token": token])
        })
        pushObservers.append(center.addObserver(
            forName: Notification.Name("PingCarAPNsRegistrationFailed"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            let error = notification.userInfo?["error"] as? String ?? "Apple push registration failed."
            self?.sendPushEvent("pingcar-push-error", detail: ["error": error])
        })
        pushObservers.append(center.addObserver(
            forName: Notification.Name("PingCarPushOpened"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let url = notification.userInfo?["url"] as? String else { return }
            UserDefaults.standard.removeObject(forKey: "PingCarPendingPushURL")
            self?.openPushURL(url)
        })
    }

    private func handlePush(action: String) {
        switch action {
        case "register":
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { [weak self] granted, error in
                if let error {
                    self?.sendPushEvent("pingcar-push-error", detail: ["error": error.localizedDescription])
                    return
                }
                guard granted else {
                    self?.sendPushEvent("pingcar-push-error", detail: ["error": "Notification permission was not granted."])
                    return
                }
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        case "getState":
            if let token = UserDefaults.standard.string(forKey: "PingCarAPNsDeviceToken") {
                sendPushEvent("pingcar-push-token", detail: ["token": token])
            }
            if let url = UserDefaults.standard.string(forKey: "PingCarPendingPushURL") {
                UserDefaults.standard.removeObject(forKey: "PingCarPendingPushURL")
                openPushURL(url)
            }
        default:
            break
        }
    }

    private func sendPushEvent(_ name: String, detail: [String: String]) {
        guard let webView = pushWebView,
              let data = try? JSONSerialization.data(withJSONObject: detail),
              let json = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript(
            "window.dispatchEvent(new CustomEvent('\(name)', { detail: \(json) }));"
        )
    }

    private func openPushURL(_ url: String) {
        guard url.hasPrefix("/message.html?"),
              let webView = pushWebView,
              let data = try? JSONSerialization.data(withJSONObject: url),
              let jsString = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.location.assign(\(jsString));")
    }

    private func setupWebViewObservation() {
        guard let webView = findWebView(in: view) else {
            return
        }

        webViewObservation = webView.observe(
            \.canGoBack,
            options: [.initial, .new]
        ) { [weak self] webView, _ in

            DispatchQueue.main.async {
                self?.backButton.isHidden = !webView.canGoBack
            }
        }
    }

    private func enableBackSwipe() {
        guard let webView = findWebView(in: view) else {
            return
        }

        webView.allowsBackForwardNavigationGestures = true
    }

    private func setupBackButton() {
        backButton = UIButton(type: .system)

        if let image = UIImage(systemName: "chevron.left") {
            backButton.setImage(image, for: .normal)
        } else {
            backButton.setTitle("‹", for: .normal)
        }

        backButton.tintColor = .white

        backButton.backgroundColor =
            UIColor.black.withAlphaComponent(0.45)

        backButton.layer.cornerRadius = 22
        backButton.translatesAutoresizingMaskIntoConstraints = false

        backButton.addTarget(
            self,
            action: #selector(goBack),
            for: .touchUpInside
        )

        view.addSubview(backButton)

        NSLayoutConstraint.activate([
            backButton.leadingAnchor.constraint(
                equalTo: view.safeAreaLayoutGuide.leadingAnchor,
                constant: 12
            ),

            backButton.topAnchor.constraint(
                equalTo: view.safeAreaLayoutGuide.topAnchor,
                constant: 8
            ),

            backButton.widthAnchor.constraint(equalToConstant: 44),
            backButton.heightAnchor.constraint(equalToConstant: 44)
        ])

        backButton.isHidden = true
    }

    @objc private func goBack() {
        guard let webView = findWebView(in: view) else {
            return
        }

        if webView.canGoBack {
            webView.goBack()
        }
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        if message.name == "pingcarPush" {
            guard let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }
            handlePush(action: action)
            return
        }

        if message.name == "pingcarIAP" {
            guard let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }
            let callbackId = body["callbackId"] as? String
            handleIAP(action: action, body: body, callbackId: callbackId)
            return
        }

        guard message.name == "pingcarShareQR",
              let dataURL = message.body as? String,
              let commaIndex = dataURL.firstIndex(of: ",") else {
            return
        }

        let base64 = String(
            dataURL[dataURL.index(after: commaIndex)...]
        )

        guard let data = Data(base64Encoded: base64),
              let image = UIImage(data: data) else {
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            let activityVC = UIActivityViewController(
                activityItems: [image],
                applicationActivities: nil
            )

            activityVC.popoverPresentationController?.sourceView =
                self.view

            activityVC.popoverPresentationController?.sourceRect =
                CGRect(
                    x: self.view.bounds.midX,
                    y: self.view.bounds.midY,
                    width: 0,
                    height: 0
                )

            self.present(
                activityVC,
                animated: true
            )
        }
    }

    private func handleIAP(action: String, body: [String: Any], callbackId: String?) {
        switch action {
        case "products":
            Task {
                do {
                    let products = try await Product.products(for: iapProductIDs)
                    let result = products.map { product in
                        ["id": product.id, "displayPrice": product.displayPrice,
                         "displayName": product.displayName] as [String: Any]
                    }
                    sendIAPResult(callbackId, payload: ["products": result])
                } catch {
                    sendIAPResult(callbackId, error: error.localizedDescription)
                }
            }
        case "purchase":
            guard let productId = body["productId"] as? String,
                  iapProductIDs.contains(productId) else {
                sendIAPResult(callbackId, error: "Abonimi i zgjedhur nuk është i vlefshëm.")
                return
            }
            let accountToken = (body["appAccountToken"] as? String).flatMap(UUID.init(uuidString:))
            Task {
                do {
                    let products = try await Product.products(for: [productId])
                    guard let product = products.first else {
                        sendIAPResult(callbackId, error: "Abonimi nuk u gjet në App Store.")
                        return
                    }
                    // A PingCar account is optional at purchase time. If a user
                    // is already signed in, retain the secure account link;
                    // otherwise link the verified transaction after sign-up.
                    let result: Product.PurchaseResult
                    if let accountToken {
                        result = try await product.purchase(options: [.appAccountToken(accountToken)])
                    } else {
                        result = try await product.purchase()
                    }
                    switch result {
                    case .success(let verification):
                        switch verification {
                        case .verified(let transaction):
                            sendIAPResult(callbackId, payload: [
                                "status": "success",
                                "transactionId": String(transaction.id),
                                "signedTransactionInfo": verification.jwsRepresentation
                            ])
                        case .unverified(_, let error):
                            sendIAPResult(callbackId, error: "Apple nuk e verifikoi blerjen: \(error.localizedDescription)")
                        }
                    case .pending:
                        sendIAPResult(callbackId, payload: ["status": "pending"])
                    case .userCancelled:
                        sendIAPResult(callbackId, payload: ["status": "cancelled"])
                    @unknown default:
                        sendIAPResult(callbackId, error: "Rezultati i blerjes nuk u njoh.")
                    }
                } catch {
                    sendIAPResult(callbackId, error: error.localizedDescription)
                }
            }
        case "restore":
            Task {
                do {
                    try await AppStore.sync()
                    let transactions = await currentEntitlementTransactions()
                    sendIAPResult(callbackId, payload: ["transactions": transactions])
                } catch {
                    sendIAPResult(callbackId, error: error.localizedDescription)
                }
            }
        case "entitlements":
            Task {
                let transactions = await currentEntitlementTransactions()
                sendIAPResult(callbackId, payload: ["transactions": transactions])
            }
        case "finish":
            guard let idString = body["transactionId"] as? String,
                  let transactionId = UInt64(idString) else {
                sendIAPResult(callbackId, error: "ID-ja e transaksionit nuk është e vlefshme.")
                return
            }
            Task {
                for await result in Transaction.unfinished {
                    if case .verified(let transaction) = result, transaction.id == transactionId {
                        await transaction.finish()
                        sendIAPResult(callbackId, payload: ["finished": true])
                        return
                    }
                }
                // StoreKit may already mark a restored transaction as finished.
                sendIAPResult(callbackId, payload: ["finished": true])
            }
        default:
            sendIAPResult(callbackId, error: "Veprimi i blerjes nuk njihet.")
        }
    }

    private func currentEntitlementTransactions() async -> [[String: String]] {
        var items: [[String: String]] = []
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result,
                  iapProductIDs.contains(transaction.productID) else { continue }
            items.append([
                "transactionId": String(transaction.id),
                "signedTransactionInfo": result.jwsRepresentation
            ])
        }
        return items
    }

    private func sendIAPResult(_ callbackId: String?, payload: [String: Any]? = nil, error: String? = nil) {
        guard let callbackId, let webView = iapWebView else { return }
        var detail: [String: Any] = ["callbackId": callbackId]
        if let payload { detail["payload"] = payload }
        if let error { detail["error"] = error }
        guard let data = try? JSONSerialization.data(withJSONObject: detail, options: [.fragmentsAllowed]),
              let json = String(data: data, encoding: .utf8) else { return }
        DispatchQueue.main.async {
            webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('pingcar-iap-result', { detail: \(json) }));")
        }
    }

    deinit {
        webViewObservation?.invalidate()
        pushObservers.forEach { NotificationCenter.default.removeObserver($0) }
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else {
            return
        }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = PingCarViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(
            scene,
            willConnectTo: session,
            options: connectionOptions
        )
    }

    func scene(
        _ scene: UIScene,
        openURLContexts URLContexts: Set<UIOpenURLContext>
    ) {
        SceneDelegateProxy.shared.scene(
            scene,
            openURLContexts: URLContexts
        )
    }

    func scene(
        _ scene: UIScene,
        continue userActivity: NSUserActivity
    ) {
        SceneDelegateProxy.shared.scene(
            scene,
            continue: userActivity
        )
    }
}
