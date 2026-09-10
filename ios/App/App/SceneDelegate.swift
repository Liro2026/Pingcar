import UIKit
import Capacitor
import WebKit

final class PingCarViewController: CAPBridgeViewController {

    private var backButton: UIButton!

    override func viewDidLoad() {
        super.viewDidLoad()

        enableBackSwipe(in: view)
        setupBackButton()
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

    private func enableBackSwipe(in view: UIView) {
        if let webView = view as? WKWebView {
            webView.allowsBackForwardNavigationGestures = true
            return
        }

        for subview in view.subviews {
            enableBackSwipe(in: subview)
        }
    }

    private func setupBackButton() {
        backButton = UIButton(type: .system)

        backButton.setTitle("‹", for: .normal)
        backButton.titleLabel?.font = UIFont.systemFont(ofSize: 38, weight: .medium)
        backButton.setTitleColor(.white, for: .normal)

        backButton.backgroundColor = UIColor.black.withAlphaComponent(0.35)
        backButton.layer.cornerRadius = 22

        backButton.translatesAutoresizingMaskIntoConstraints = false
        backButton.addTarget(
            self,
            action: #selector(goBack),
            for: .touchUpInside
        )

        view.addSubview(backButton)

        NSLayoutConstraint.activate([
            backButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 12),
            backButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            backButton.widthAnchor.constraint(equalToConstant: 44),
            backButton.heightAnchor.constraint(equalToConstant: 44)
        ])

        updateBackButton()
    }

    @objc private func goBack() {
        guard let webView = findWebView(in: view) else {
            return
        }

        if webView.canGoBack {
            webView.goBack()
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            self.updateBackButton()
        }
    }

    private func updateBackButton() {
        guard let webView = findWebView(in: view) else {
            return
        }

        backButton.isHidden = !webView.canGoBack
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

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