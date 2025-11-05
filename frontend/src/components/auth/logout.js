import {AuthUtils} from "../../utils/auth-utils";
import {AuthService} from "../../services/auth-service";

export class Logout {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;
        this.refreshToken = AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey);
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !this.refreshToken) {
            this.openNewRoute('/login').then();
            return;
        }
        this.logout().then();
    }

    async logout() {
            if (typeof this.refreshToken === "string") {
                await AuthService.logOut({ refreshToken: this.refreshToken });
            }
            AuthUtils.removeAuthInfo();
            await this.openNewRoute('/login');
        };

}
