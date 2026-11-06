import { UnknownPack } from "../components/PackList";

export default async function NotFound() {
  return <UnknownPack />;
}

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
