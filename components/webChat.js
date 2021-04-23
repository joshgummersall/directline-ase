import React, { useMemo } from "react";
import ReactWebChat from "botframework-webchat";
import { DirectLineStreaming } from "botframework-directlinejs";

export default function WebChat({ domain, token }) {
  const directLine = useMemo(() => new DirectLineStreaming({ domain, token }), [
    domain,
    token,
  ]);

  return <ReactWebChat directLine={directLine} />;
}
