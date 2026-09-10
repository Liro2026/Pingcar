import UIKit
import Capacitor
import WebKit

final class PingCarViewController: CAPBridgeViewController {

    private var backButton: UIButton!
    private var webViewObservation: NSKeyValueObservation?

    override func viewDidLoad() {
        super.viewDidLoad()

        setupBackButton()

        DispatchQueue.main.async { [weak self] in
            self?.setupWebViewObservation()
            self?.enableBackSwipe()
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

    deinit {
        webViewObservation?.invalidate()
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