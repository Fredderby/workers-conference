"use client";
import dynamic from "next/dynamic";
import { swaggerSpec } from "@/lib/swagger";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function SwaggerClient() {
  return <SwaggerUI spec={swaggerSpec as any} />;
}
