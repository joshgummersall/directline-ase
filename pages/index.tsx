import * as rt from "runtypes";
import Head from "next/head";
import React, { useCallback, useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DirectLineStreaming } from "botframework-directlinejs";
import { Formik } from "formik";
import { State } from "../components/state";

import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";

const ReactWebChat = dynamic<any>(() => import("botframework-webchat"), {
  ssr: false,
});

const Token = rt.Record({
  token: rt.String,
});

const Status = rt.Record({
  v: rt.String,
  k: rt.Boolean,
  ib: rt.Boolean,
  ob: rt.Boolean,
  initialized: rt.Boolean,
});

const Configure: React.FC<{
  onHide: () => void;
  show: boolean;
}> = ({ show, onHide }) => {
  const [state, setState] = useContext(State);

  const onSubmit = useCallback(
    (values, formik) => {
      setState(values);

      setTimeout(() => {
        formik.setSubmitting(false);
        onHide();
      }, 1000);
    },
    [setState, onHide]
  );

  const [status, setStatus] = useState<rt.Static<typeof Status> | undefined>();
  const onStatus = useCallback(
    async (botUrl: string) => {
      if (!botUrl) {
        return;
      }

      setStatus(undefined);

      const resp = await fetch(`${botUrl}/.bot`);

      if (resp.ok) {
        setStatus(Status.check(await resp.json()));
      }
    },
    [setStatus]
  );

  return (
    <Formik initialValues={state} onSubmit={onSubmit}>
      {({
        handleBlur,
        handleChange,
        handleReset,
        handleSubmit,
        isSubmitting,
        values,
      }) => (
        <Modal show={show} onHide={onHide}>
          <Form onReset={handleReset} onSubmit={handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>Configure Bot</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group>
                <Form.Label>Bot URL</Form.Label>
                <Form.Control
                  name="botUrl"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  required
                  value={values.botUrl}
                />
                <Form.Text className="text-muted">
                  This is the Azure App Service URL for your bot.
                </Form.Text>
              </Form.Group>
              <Form.Group>
                <Form.Label>Directline Secret</Form.Label>
                <Form.Control
                  name="directLineSecret"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  required
                  value={values.directLineSecret}
                />
                <Form.Text className="text-muted">
                  The Directline Secret can be found in the Bot Channel Channels
                  blade. This is never saved and is used only to fetch a token.
                </Form.Text>
              </Form.Group>
              {status && (
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <div>
                    <pre>{JSON.stringify(status, null, 2)}</pre>
                  </div>
                  <Form.Text className="text-muted">
                    See{" "}
                    <a
                      href="https://docs.microsoft.com/en-us/azure/bot-service/bot-service-channel-directline-extension-node-bot?view=azure-bot-service-4.0#confirm-direct-line-app-extension-and-the-bot-are-configured"
                      rel="noopener noreferer"
                      target="_blank"
                    >
                      here
                    </a>{" "}
                    for an explanation of the results.
                  </Form.Text>
                </Form.Group>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => onStatus(values.botUrl)}
              >
                Fetch status
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Save changes
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </Formik>
  );
};

export default function Index() {
  const [state] = useContext(State);

  const [show, setShow] = useState<boolean>(
    !state.botUrl || !state.directLineSecret
  );

  const onShow = useCallback(() => setShow(true), [setShow]);
  const onHide = useCallback(() => setShow(false), [setShow]);

  const [directLine, setDirectLine] = useState<DirectLineStreaming>();

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      if (!state.botUrl) {
        return;
      }

      if (!state.directLineSecret) {
        return;
      }

      const resp = await fetch(
        `${state.botUrl}/.bot/v3/directline/tokens/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.directLineSecret}`,
          },
          signal: ac.signal,
        }
      );

      if (ac.signal.aborted) {
        return;
      }

      if (!resp.ok) {
        return;
      }

      const { token } = Token.check(await resp.json());

      setDirectLine(
        new DirectLineStreaming({
          domain: `${state.botUrl}/.bot/v3/directline`,
          token,
        })
      );
    })();

    return () => ac.abort();
  }, [setDirectLine, state.botUrl, state.directLineSecret]);

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
              <Nav.Link onClick={onShow}>Configure</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="h-100">
        <Row className="h-100">
          <Col xs={12}>
            {directLine && <ReactWebChat directLine={directLine} />}
          </Col>
        </Row>
      </Container>
      <Configure show={show} onHide={onHide} />
    </>
  );
}
