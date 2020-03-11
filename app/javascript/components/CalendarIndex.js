import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import CardColumns from "react-bootstrap/CardColumns";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Jumbotron from "react-bootstrap/Jumbotron";
import { shortFormatDateAll } from "./Events.js";
import $ from "jquery";
import {
  LandownerRemoveVendor,
  LandownerAddVendor,
  LandownerRemoveTenant,
  LandownerAddTenant,
  TenantReviewSuccess,
  TenantStreetAddress
} from "./CalendarModals";
import StarRatings from "react-star-ratings";
import { Switch, Route, MemoryRouter } from "react-router-dom";
import VendorCalendar from "./VendorCalendar.js";
import CalendarProfile from "./CalendarProfile.js";

/*
isLoaded: mounting landowner response
isLoaded2: mounting landowner's tenants response
landownerResponse: returns landowner with landowner id === landowner_id
tenantResponse: returns all tenants without a landowner
*/
const CalendarIndex = props => {
  const [STATE, SETSTATE] = useState({
    showM: false,
    TITLE: "",
    JID: null,
    VID: null
  });
  const [state, setState] = useState({
    error: null,
    isLoaded: false,
    landownerResponse: null,
    tenantResponse: null,
    isLoaded2: false,
    isLoaded3: false,
    vendorResponse: null,
    reviewSuccess: false
  });
  const [State, SetState] = useState({
    text: "",
    rate: "0.0"
  });

  const [show, setShow] = useState(true);

  const [landownerState, setLandownerState] = useState({
    vendorModal: false,
    addVendorModal: false,
    tenantModal: false,
    addTenantModal: false
  });

  const [mapState, setMapState] = useState({
    start_home: true,
    loading_maps: true,
    job_index: null
  });

  const handleUpdateVendorRating = (vendor_id, rate, job_id) => {
    fetch(`http://localhost:3000/vendors/update_rating`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_id: vendor_id,
        rating: rate,
        job_id: job_id
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response.status == 200) {
          setState({ ...state, reviewSuccess: true });
        } else {
          alert("Failed to update vendor");
        }
      });
  };

  const handleJobReview = (event, job_id, text, rate, vendor_id) => {
    parseFloat(rate);
    event.preventDefault();
    fetch("http://localhost:3000/reviews/new_review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Transaction": "POST Example",
        "X-CSRF-Token": $('meta[name="csrf-token"]').attr("content")
      },
      body: JSON.stringify({
        job_id: job_id,
        rating: rate,
        text: text
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response.status == "200") {
          handleUpdateVendorRating(vendor_id, rate, job_id);
        } else if (response.status == "210") {
          alert("Already Reviewed");
          window.location.reload(false);
        }
      });
  };

  const handleDeleteVendor = (event, landowner_id, vendor_id) => {
    event.preventDefault();
    fetch(
      `http://localhost:3000/landowner/${landowner_id}/vendors/${vendor_id}`,
      {
        method: "DELETE"
      }
    )
      .then(response => response.json())
      .then(response => {
        if (response.status == "200") {
          setLandownerState({ ...landownerState, vendorModal: true });
        } else {
          alert("Failed to remove vendor.");
        }
      });
  };

  const handleClickVendor = (event, landowner_id, vendor_id) => {
    event.preventDefault();
    fetch("http://localhost:3000/landowner/add_vendor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landowner_id: landowner_id,
        vendor_id: vendor_id
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response.code == "200") {
          setLandownerState({ ...landownerState, addVendorModal: true });
        } else {
          alert("Failed to add vendor (returned code 400)");
        }
      });
  };

  const handleDeleteTenant = (event, tenant_id) => {
    event.preventDefault();
    fetch(`http://localhost:3000/landowner/tenants/${tenant_id}`, {
      method: "DELETE"
    })
      .then(response => response.json())
      .then(response => {
        if (response.status == "200") {
          setLandownerState({ ...landownerState, tenantModal: true });
        } else {
          alert("Failed to remove tenant.");
        }
      });
  };

  // POST request adds tenant to the landowner
  const handleClickTenant = (event, landowner_id, tenant_id) => {
    event.preventDefault();
    fetch("http://localhost:3000/landowner/add_tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landowner_id: landowner_id,
        tenant_id: tenant_id
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response.code == "200") {
          setLandownerState({ ...landownerState, addTenantModal: true });
        } else {
          alert("Failed to add tenant (returned code 400)");
        }
      });
  };

  useEffect(() => {
    if (props.user_type == "Tenant") {
      fetch(`http://localhost:3000/landowner/${props.user.landowner_id}`, {
        method: "GET"
      })
        .then(res => res.json())
        .then(
          res => {
            setState(prevState => ({
              ...prevState,
              isLoaded: true,
              landownerResponse: res
            }));
          },
          error => {
            setState(prevState => ({
              ...prevState,
              isLoaded: false,
              error: error
            }));
          }
        )
        .then(res => {
          fetch(`http://localhost:3000/tenants/${props.user.id}`, {
            method: "GET"
          })
            .then(res => res.json())
            .then(
              res => {
                setState(prevState => ({
                  ...prevState,
                  isLoaded2: true,
                  tenantResponse: res
                }));
              },
              error => {
                setState(prevState => ({
                  ...prevState,
                  isLoaded2: false,
                  error: error
                }));
              }
            );
        });
    } else if (props.user_type == "Landowner") {
      fetch("http://localhost:3000/tenants/no_landowner", { method: "GET" })
        .then(res => res.json())
        .then(
          res => {
            setState(prevState => ({
              ...prevState,
              isLoaded: true,
              tenantResponse: res
            }));
          },
          error => {
            setState(prevState => ({
              ...prevState,
              isLoaded: false,
              error: error
            }));
          }
        );
      fetch(`http://localhost:3000/landowner/${props.user.id}`, {
        method: "GET"
      })
        .then(res => res.json())
        .then(
          res => {
            setState(prevState => ({
              ...prevState,
              landownerResponse: res,
              isLoaded2: true
            }));
          },
          error => {
            setState(prevState => ({
              ...prevState,
              error: error
            }));
          }
        );
      fetch(`http://localhost:3000/vendors/`, {
        method: "GET"
      })
        .then(res => res.json())
        .then(
          res => {
            setState(prevState => ({
              ...prevState,
              vendorResponse: res,
              isLoaded3: true
            }));
          },
          error => {
            setState(prevState => ({
              ...prevState,
              error: error
            }));
          }
        );
    } else if (props.user_type == "Vendor") {
      fetch(`http://localhost:3000/vendors/${props.user.id}`, {
        method: "GET"
      })
        .then(res => res.json())
        .then(res => {
          setState(prevState => ({
            ...prevState,
            vendorResponse: res,
            isLoaded: true
          })),
            setMapState(prevState => ({
              ...prevState,
              job_index: res.jobs.length ? 0 : null,
              loading_maps: false
            })),
            error => {
              setState(prevState => ({
                ...prevState,
                error: error
              }));
            };
        });
    }
  }, []);

  const {
    error,
    isLoaded,
    landownerResponse,
    tenantResponse,
    vendorResponse,
    isLoaded2,
    isLoaded3,
    reviewSuccess
  } = state;
  const { text, rate } = State;
  const { showM, TITLE, JID, VID } = STATE;
  if (error) {
    return <div>Error in loading... please refresh.</div>;
  } else if (!isLoaded) {
    return (
      <div>
        <Spinner
            variant="primary"
            animation="border"
            style={{
              width: "5rem",
              height: "5rem",
              position: "fixed",
              top: "50vh",
              left: "50vw"
            }}
          />
      </div>
    );
  } else if (props.user_type == "Tenant" && !isLoaded2) {
    return (
      <div>
        <Spinner
            variant="primary"
            animation="border"
            style={{
              width: "5rem",
              height: "5rem",
              position: "fixed",
              top: "50vh",
              left: "50vw"
            }}
          />
      </div>
    );
  } else if ((!isLoaded2 || !isLoaded3) && props.user_type == "Landowner") {
    return (
      <div>
        <Spinner
            variant="primary"
            animation="border"
            style={{
              width: "5rem",
              height: "5rem",
              position: "fixed",
              top: "50vh",
              left: "50vw"
            }}
          />
      </div>
    );
  } else if (props.user_type == "Vendor" && mapState.loading_maps) {
    return <div><Spinner
    variant="primary"
    animation="border"
    style={{
      width: "5rem",
      height: "5rem",
      position: "fixed",
      top: "50vh",
      left: "50vw"
    }}
  /></div>;
  } else if (props.user_type == "Tenant") {
    if (!tenantResponse.street_address) {
      return <TenantStreetAddress />;
    }
    return (
      <div>
        <header className="bg-dark py-1">
          <h1 align="center" className="display-1 text-white mt-5 mb-2">
            {props.user_type} Homepage
          </h1>
          <p align="center" className="lead text-light">
            View your scheduled and completed jobs, or submit a new job request
            here!
          </p>
        </header>
        <div className="container">
          <Tabs defaultActiveKey="Scheduled" style={{ marginTop: "0.8rem" }}>
            <Tab eventKey="Scheduled" title="Scheduled">
              {tenantResponse.has_approved_job ? (
                !show ? (
                  <Button
                    size="lg"
                    variant="warning"
                    onClick={() => setShow(true)}
                    style={{ marginTop: "0.8rem" }}
                    block
                  >
                    ⚠ Alert: You have jobs ready to be scheduled!
                  </Button>
                ) : (
                  <Alert
                    show={show}
                    variant="warning"
                    style={{ marginTop: "0.8rem" }}
                  >
                    <Alert.Heading>
                      You have jobs ready to be scheduled!
                    </Alert.Heading>
                    <p>
                      Your job request was matched with your landowner's
                      vendors. We found several times for you to schedule your
                      job; don't worry, we made sure these times do not conflict
                      with your schedule. Click one of your calendars to
                      schedule and we'll take care of everything else.
                    </p>
                    <hr />
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="outline-dark"
                        style={{ marginRight: "0.8rem" }}
                        onClick={() =>
                          (window.location.href = "/calendar/vendor_selection")
                        }
                      >
                        Continue
                      </Button>
                      <Button
                        onClick={() => setShow(false)}
                        variant="outline-dark"
                      >
                        Hide
                      </Button>
                    </div>
                  </Alert>
                )
              ) : null}

              <Jumbotron style={{ marginTop: "0.8rem" }}>
                <h1>Start your job request here </h1>
                <p>
                  Need to schedule a new job request? Click the button below to
                  start and finish in just four easy steps.{" "}
                </p>
                <Button
                  variant="primary"
                  href="http://localhost:3000/jobs/new"
                  size="lg"
                  style={{ marginTop: "0.8rem" }}
                >
                  Begin new job request
                </Button>
              </Jumbotron>

              {tenantResponse.jobs.filter(job => job.status == "COMPLETE")
                .length ? (
                ""
              ) : (
                <h2>You have no scheduled jobs</h2>
              )}
              <CardColumns>
                {tenantResponse.jobs
                  .filter(job => job.status == "COMPLETE")
                  .map(job => (
                    <Card
                      bg="warning"
                      text="dark"
                      border="warning"
                      style={{ width: "18rem" }}
                    >
                      <Card.Header>{job.title}</Card.Header>
                      <Card.Body>
                        <Card.Title>
                          Scheduled for {shortFormatDateAll(job.start)} to{" "}
                          {shortFormatDateAll(job.end)} assigned to{" "}
                          {job.vendor_name}
                        </Card.Title>
                        <Card.Text>Description: {job.content}</Card.Text>
                      </Card.Body>
                    </Card>
                  ))}
              </CardColumns>
            </Tab>
            <Tab eventKey="Completed" title="Completed">
              <CardColumns style={{ marginTop: "0.8rem" }}>
                {tenantResponse.jobs
                  .filter(job => job.status == "VENDOR COMPLETE")
                  .map(job => (
                    <Card
                      bg="success"
                      text="white"
                      border="success"
                      style={{ width: "18rem" }}
                    >
                      <Card.Header>{job.title}</Card.Header>
                      <Card.Body>
                        <Card.Title>
                          Completed by {job.vendor_name} from{" "}
                          {shortFormatDateAll(job.start)} to{" "}
                          {shortFormatDateAll(job.end)}
                        </Card.Title>
                        <Card.Text>Description: {job.content}</Card.Text>
                        {job.reviewed ? (
                          <Button variant="primary" disabled>
                            Reviewed
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            onClick={() =>
                              SETSTATE({
                                showM: true,
                                TITLE: job.title,
                                JID: job.id,
                                VID: job.vendor_id
                              })
                            }
                          >
                            Review
                          </Button>
                        )}

                        <Modal
                          show={showM}
                          onHide={e => SETSTATE({ ...STATE, showM: false })}
                        >
                          <Modal.Header closeButton>
                            <Modal.Title>{TITLE}</Modal.Title>
                          </Modal.Header>
                          <Modal.Body>
                            <Form>
                              <Form.Group controlId="starRating">
                                <Form.Label style={{ marginRight: "1.0rem" }}>
                                  Rate
                                </Form.Label>
                                <StarRatings
                                  rating={parseFloat(rate)}
                                  starRatedColor="gold"
                                  starHoverColor="gold"
                                  starSpacing="2px"
                                  changeRating={(rating, name) =>
                                    SetState({ ...State, rate: rating })
                                  }
                                  numberOfStars={5}
                                  name="rating"
                                />
                              </Form.Group>

                              <Form.Group controlId="exampleForm.ControlTextarea1">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows="6"
                                  placeholder="Review Description"
                                  onChange={event =>
                                    SetState({
                                      ...State,
                                      text: event.target.value
                                    })
                                  }
                                />
                              </Form.Group>
                            </Form>
                          </Modal.Body>
                          <Modal.Footer>
                            <Button
                              variant="danger"
                              onClick={e =>
                                SETSTATE({ ...STATE, showM: false })
                              }
                            >
                              Exit
                            </Button>
                            <Button
                              variant="primary"
                              onClick={event => {
                                SETSTATE({ ...STATE, showM: false });
                                handleJobReview(event, JID, text, rate, VID);
                              }}
                            >
                              Submit
                            </Button>
                          </Modal.Footer>
                        </Modal>
                      </Card.Body>
                    </Card>
                  ))}
              </CardColumns>
            </Tab>
            <Tab eventKey="Profile" title="Profile">
              <CalendarProfile
                user={props.user}
                landowner={
                  props.user.landowner_id == 0 ? null : landownerResponse
                }
              />
            </Tab>
          </Tabs>
          <TenantReviewSuccess show={reviewSuccess} />
        </div>
      </div>
    );
  } else if (props.user_type == "Landowner") {
    return (
      <div className="container">
        <h1 align="center">{props.user_type} Calendar Page</h1>

        {landownerResponse.tenants.length ? (
          <div>
            <h2>Your Tenants (click to delete tenant): </h2>
            <CardColumns>
              {landownerResponse.tenants.map(tenant => (
                <Card ml-3 border="primary">
                  <Card.Header as="h5" align="center">
                    {tenant.name}
                  </Card.Header>
                  <Card.Body>
                    <Card.Text>
                      <b>Email:</b> {tenant.email}
                      <br />
                      <b>Address:</b> {tenant.street_address}
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      {tenant.city}, {tenant.state} {tenant.zip}
                    </Card.Text>
                    <Button
                      variant="outline-danger"
                      onClick={e => handleDeleteTenant(e, tenant.id)}
                    >
                      {" "}
                      Remove Tenant{" "}
                    </Button>
                  </Card.Body>
                </Card>
              ))}
            </CardColumns>
          </div>
        ) : (
          <h2>You have no tenants.</h2>
        )}
        {landownerResponse.vendors.length ? (
          <div>
            <h2>Your vendors (click to delete vendor): </h2>
            <CardColumns>
              {landownerResponse.vendors.map(vendor => (
                <Card ml-2 border="success">
                  <Card.Header as="h5">{vendor.name}</Card.Header>
                  <Card.Body>
                    <Card.Text>
                      <b>Email: </b>
                      {vendor.email}
                      <br />
                      <b>Occupation: </b>
                      {vendor.occupation}
                      <br />
                      {
                        <StarRatings
                          rating={parseFloat(
                            vendor.rating ? vendor.rating.toFixed(2) : "0.0"
                          )}
                          starDimension="19px"
                          starSpacing="1px"
                          starRatedColor="gold"
                          numberOfStars={5}
                          name="rating"
                        />
                      }
                    </Card.Text>
                    <Button
                      variant="outline-danger"
                      onClick={e =>
                        handleDeleteVendor(e, props.user.id, vendor.id)
                      }
                    >
                      {" "}
                      Remove Vendor{" "}
                    </Button>
                  </Card.Body>
                </Card>
              ))}
            </CardColumns>
          </div>
        ) : (
          <h2>You have no vendors</h2>
        )}

        <h2>Select user below to add as your listed tenant.</h2>
        <CardColumns>
          {tenantResponse
            .filter(tenant => tenant.id != 0)
            .map(tenant => (
              <Card ml-2 border="primary">
                <Card.Header as="h5">{tenant.name}</Card.Header>
                <Card.Body>
                  <Card.Text>
                    <b>Email: </b>
                    {tenant.email}
                    <br />
                    <b>Address: </b>
                    {tenant.street_address}
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {tenant.city}, {tenant.state} {tenant.zip}
                  </Card.Text>
                  <Button
                    variant="outline-primary"
                    onClick={e =>
                      handleClickTenant(e, props.user.id, tenant.id)
                    }
                  >
                    {" "}
                    Add Tenant{" "}
                  </Button>
                </Card.Body>
              </Card>
            ))}
        </CardColumns>

        <h2>Select user below to add as your listed vendor.</h2>
        <CardColumns>
          {vendorResponse
            .filter(
              vendor =>
                vendor.landowners.filter(
                  landowner => landowner.id == props.user.id
                ).length == 0 && vendor.id != 0
            )
            .map(vendor => (
              <Card ml-2 border="success">
                <Card.Header as="h5">{vendor.name}</Card.Header>
                <Card.Body>
                  <Card.Text>
                    <b>Email: </b>
                    {vendor.email}
                    <br />
                    <b>Occupation: </b>
                    {vendor.occupation}
                    <br />
                    {
                      <StarRatings
                        rating={parseFloat(vendor.rating.toFixed(2))}
                        starDimension="19px"
                        starSpacing="1px"
                        starRatedColor="gold"
                        numberOfStars={5}
                        name="rating"
                      />
                    }
                  </Card.Text>
                  <Button
                    variant="outline-success"
                    onClick={e =>
                      handleClickVendor(e, props.user.id, vendor.id)
                    }
                  >
                    {" "}
                    Add Vendor{" "}
                  </Button>
                </Card.Body>
              </Card>
            ))}
        </CardColumns>

        <LandownerRemoveVendor show={landownerState.vendorModal} />
        <LandownerAddVendor show={landownerState.addVendorModal} />
        <LandownerRemoveTenant show={landownerState.tenantModal} />
        <LandownerAddTenant show={landownerState.addTenantModal} />
      </div>
    );
  } else if (props.user_type == "Vendor") {
    return (
      <div>
        <MemoryRouter initialEntries={["/vendors"]} initialIndex={0}>
          <Switch>
            <Route path="/vendors">
              <VendorCalendar
                state={state}
                user_type={props.user_type}
                user={props.user}
                vendorResponse={vendorResponse}
                calendars={props.calendars}
                GOOGLE_MAPS_KEY={props.GOOGLE_MAPS_KEY}
                job_index={mapState.job_index}
              />
            </Route>
          </Switch>
        </MemoryRouter>
      </div>
    );
  }
};

export default CalendarIndex;
