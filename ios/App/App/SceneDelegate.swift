import UIKit
import Capacitor
import WebKit

final class PingCarViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        enableBackSwipe(in: view)
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