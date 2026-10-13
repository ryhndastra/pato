import { env } from "./config.js";
import { app } from "./app.js";
if (!process.env.VERCEL) {
    app.listen(env.port, () => {
        console.log(`PaTo backend jalan di http://localhost:${env.port}`);
    });
}
export default app;
//# sourceMappingURL=index.js.map