import * as rt from "runtypes";
import Head from "next/head";
import React, { useCallback, useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DirectLineStreaming } from "botframework-directlinejs";
import { Formik } from "formik";
import { State, StateT } from "../components/state";

import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";
import Toast from "react-bootstrap/Toast";

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

const Configure: React.FC<{
  onHide: () => void;
  show: boolean;
}> = ({ show, onHide }) => {
  const [state, setState] = useContext(State);
  const [persist, setPersist] = useState(true);

  const onSubmit = useCallback(
    (values, formik) => {
      setState(values);
      if (persist) {
        location.hash = btoa(JSON.stringify(values));
      }
      formik.setSubmitting(false);
      onHide();
    },
    [setState, persist]
  );

  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const onDismiss = useCallback(() => setError(undefined), [setError]);

  const [status, setStatus] = useState<rt.Static<typeof Status> | undefined>();

  const onStatus = useCallback(
    async (botUrl: string) => {
      try {
        setFetching(true);

        if (!botUrl) {
          return setError("Bot URL is required");
        }

        setStatus(undefined);

        const resp = await fetch(`${botUrl}/.bot`);

        if (!resp.ok) {
          return setError(await resp.text());
        }

        setError(undefined);
        setStatus(Status.check(await resp.json()));
      } catch (err) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    },
    [setStatus, setFetching, setError]
  );

  return (
    <Formik enableReinitialize initialValues={state} onSubmit={onSubmit}>
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
              {error && (
                <Form.Group>
                  <Alert variant="danger" dismissible onClose={onDismiss}>
                    {error}
                  </Alert>
                </Form.Group>
              )}
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
                  blade.
                </Form.Text>
              </Form.Group>
              <Form.Group controlId="location-hash">
                <Form.Check
                  label="Persist configuration"
                  name="persistConfiguration"
                  onChange={() => setPersist((persist) => !persist)}
                  type="checkbox"
                  checked={persist}
                />
                {persist && (
                  <Form.Text className="text-muted">
                    The Bot URL and Directline Secret will be persisted in
                    &apos;location.hash&apos;. This enables you to easily
                    refresh the page and continue interacting with your bot.
                    This is never transmitted to the server and never leaves
                    your browser.
                  </Form.Text>
                )}
              </Form.Group>
              {status && (
                <Form.Group>
                  <Form.Label>.bot response</Form.Label>
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
                disabled={fetching}
                onClick={() => onStatus(values.botUrl)}
                variant="secondary"
              >
                Fetch .bot
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

const Token = rt.Record({
  token: rt.String,
});

const TokenError = rt.Record({
  error: rt.Record({
    code: rt.String,
    message: rt.String,
  }),
});

export default function Index() {
  const [state, setState] = useContext(State);

  const [show, setShow] = useState<boolean>(
    !state.botUrl || !state.directLineSecret
  );

  useEffect(() => {
    if (location.hash) {
      try {
        const state = StateT.check(JSON.parse(atob(location.hash.slice(1))));

        setState(state);
        if (state.botUrl && state.directLineSecret) {
          setShow(false);
        }
      } catch (_err) {
        console.log(_err);
      }
    }
  }, [setState, setShow]);

  const onShow = useCallback(() => setShow(true), [setShow]);
  const onHide = useCallback(() => setShow(false), [setShow]);

  const [toast, setToast] = useState<
    Record<"header" | "body", string> | undefined
  >();

  const onDismiss = useCallback(() => setToast(undefined), [setToast]);
  const [directLine, setDirectLine] = useState<DirectLineStreaming>();

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setToast(undefined);

        if (!state.botUrl || !state.directLineSecret) {
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
          return setToast({
            header: "Uh oh!",
            body: "fetch signal aborted",
          });
        }

        if (!resp.ok) {
          const {
            error: { code, message },
          } = TokenError.check(await resp.json());

          return setToast({
            header: "Unable to fetch token",
            body: `Received ${code} (${message})`,
          });
        }

        const { token } = Token.check(await resp.json());

        setDirectLine(
          new DirectLineStreaming({
            domain: `${state.botUrl}/.bot/v3/directline`,
            token,
          })
        );
      } catch (err) {
        return setToast({
          header: "Unknown error",
          body: err.message,
        });
      }
    })();

    return () => ac.abort();
  }, [setToast, setDirectLine, state.botUrl, state.directLineSecret]);

  return (
    <>
      <Head>
        <title>Webchat Directline ASE</title>
      </Head>
      <Navbar bg="light" expand="lg" fixed="top">
        {toast && (
          <Toast
            show
            onClose={onDismiss}
            className="position-absolute"
            style={{ top: 0, right: 0 }}
          >
            <Toast.Header>
              <strong className="mr-auto">{toast.header}</strong>
            </Toast.Header>
            <Toast.Body>{toast.body}</Toast.Body>
          </Toast>
        )}
        <Container>
          <Navbar.Brand>DL ASE Webchat</Navbar.Brand>
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
            {directLine && (
              <ReactWebChat
                className="directline-rwc"
                directLine={directLine}
              />
            )}
          </Col>
        </Row>
      </Container>
      <Configure show={show} onHide={onHide} />
    </>
  );
}
