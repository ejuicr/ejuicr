import { Suspense } from "react";
import Prototype from "./prototype";
import Privacy from "@/app/privacy-policy/page";
import Terms from "@/app/terms-of-service/page";

export default function Page() {
  return <Suspense><Prototype privacy={<Privacy />} terms={<Terms />} /></Suspense>;
}
