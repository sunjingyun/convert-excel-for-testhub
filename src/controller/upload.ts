import { DefaultKoaContext } from "../context";

export default async function renderUploadPage(ctx: DefaultKoaContext) {
    await ctx.render("upload", {});
}
