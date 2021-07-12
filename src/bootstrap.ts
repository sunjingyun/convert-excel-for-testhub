import { OAuth2App } from "./app";

(async () => {
    const app = new OAuth2App();
    const result = await app.start(8080);
    return result;
})()
    .then(result => {
        console.log(`Server started at port 8080`);
    })
    .catch(error => {
        console.error(error);
    });
