import * as rt from "runtypes";
import Head from "next/head";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { DirectLineStreaming } from "botframework-directlinejs";

import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";

const Token = rt.Record({
  token: rt.String,
});

export const getServerSideProps: GetServerSideProps<{
  error?: string;
  token?: string;
}> = async () => {
  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_BOT_URL}/.bot/v3/directline/tokens/generate`,
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

const Status = rt.Record({
  v: rt.String,
  k: rt.Boolean,
  ib: rt.Boolean,
  ob: rt.Boolean,
  initialized: rt.Boolean,
});

export default function Index(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const { token } = props;

  const [status, setStatus] = useState<rt.Static<typeof Status> | undefined>();

  const onHide = useCallback(() => setStatus(undefined), [setStatus]);

  const onShow = useCallback(async () => {
    const resp = await fetch(`${process.env.NEXT_PUBLIC_BOT_URL}/.bot`);
    if (resp.ok) {
      setStatus(Status.check(await resp.json()));
    }
  }, [setStatus]);

  const [directLine, setDirectLine] = useState<DirectLineStreaming>();

  useEffect(() => {
    if (token) {
      setDirectLine(
        new DirectLineStreaming({
          domain: `${process.env.NEXT_PUBLIC_BOT_URL}/.bot/v3/directline`,
          token,
        })
      );
    }
  }, [setDirectLine, token]);

  if (!directLine) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Webchat Directline ASE</title>
      </Head>
      <Navbar bg="light" expand="lg" fixed="top">
        <Container>
          <Navbar.Brand>Webchat Debugger</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link onClick={onShow}>Status</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="h-100">
        <Row className="h-100">
          <Col xs={12}>
            <ReactWebChat directLine={directLine} />
          </Col>
        </Row>
      </Container>
      <Modal show={status != null} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre>{JSON.stringify(status, null, 2)}</pre>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
