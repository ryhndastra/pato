import { env } from "./config.js";
import { app } from "./app.js";

app.listen(env.port, () => {
  console.log(`PaTo backend jalan di http://localhost:${env.port}`);
});
