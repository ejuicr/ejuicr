import { Suspense } from "react";
import Prototype from "./prototype";
import Privacy from "../../src/app/privacy-policy/page";
import Terms from "../../src/app/terms-of-service/page";

export default function Page() {
  return <Suspense><Prototype privacy={<Privacy />} terms={<Terms />} /></Suspense>;
}
