import * as rt from "runtypes";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { DirectLineStreaming } from "botframework-directlinejs";

const Token = rt.Record({
  token: rt.String,
});

export const getServerSideProps: GetServerSideProps<{
  error?: string;
  token?: string;
}> = async () => {
  try {
    const resp = await fetch(
      `${process.env.BOT_URL}/.bot/v3/directline/tokens/generate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DIRECTLINE_SECRET}`,
        },
      }
    );

    if (!resp.ok) {
      return {
        props: { error: `HTTP Error ${resp.status} (${resp.statusText})` },
      };
    }

    return { props: Token.check(await resp.json()) };
  } catch (err) {
    return { props: { error: err.message } };
  }
};

const ReactWebChat = dynamic<any>(() => import("botframework-webchat"), {
  ssr: false,
});

export default function Index(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const { token } = props;

  const [directLine, setDirectLine] = useState(null);
  useEffect(() => {
    if (token) {
      setDirectLine(
        new DirectLineStreaming({
          domain: `${location.protocol}//${location.hostname}/.bot/v3/directline`,
          token,
        })
      );
    }
  }, [setDirectLine]);

  if (!token) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Webchat Directline ASE</title>
      </Head>
      <ReactWebChat directLine={directLine} />;
    </>
  );
}
