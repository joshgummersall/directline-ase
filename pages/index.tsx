import * as rt from "runtypes";
import Head from "next/head";
import React from "react";
import dynamic from "next/dynamic";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

const Token = rt.Record({
  token: rt.String,
});

export const getServerSideProps: GetServerSideProps<{
  error?: string;
  token?: string;
}> = async () => {
  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_DIRECTLINE_URL}/tokens/generate`,
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

const WebChat = dynamic(() => import("../components/webChat"), { ssr: false });

export default function Index(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const { token } = props;
  if (!token) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Webchat Directline ASE</title>
      </Head>
      <WebChat domain={process.env.NEXT_PUBLIC_DIRECTLINE_URL} token={token} />
    </>
  );
}
