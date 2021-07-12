import * as path from "path";
import views from "koa-views";
import Koa from "koa";
import Router from "koa-router";
import koaStatic from "koa-static";
import KoaBody from "koa-body";

import renderProcessPage from "./controller/process";
import renderUploadPage from "./controller/upload";

const koaBody = KoaBody({ multipart: true })

export class OAuth2App {
    start(port: number) {
        const app = new Koa();
        const router = new Router();

        app.use(
            views(path.join(__dirname, "./view"), {
                map: {
                    html: "ejs"
                }
            })
        );
        app.use(
            koaStatic(path.resolve(__dirname, "./public"), {
                maxage: 0,
                index: false
            })
        );

        router.get("/upload", async (ctx: any) => {
            await renderUploadPage(ctx);
        });

        router.post('/process', koaBody, async ctx => {
            await renderProcessPage(ctx);
        })

        app.use(router.routes()).use(router.allowedMethods()).listen(port);

        return { port: port };
    }
}
