import React, { useState } from "react";
import styles from "./_Contact.module.css";
import swal from "sweetalert";
import contact from "./../images/contact.png";
import { useForm, ValidationError } from "@formspree/react";
import Swal from "sweetalert2";

function ContactForm() {
  const [state, handleSubmit] = useForm("mleyykdv");

  const [nameValid, setNameValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [messageValid, setMessageValid] = useState(false);

  const validateName = (value) => {
    // Add your custom validation logic for the name field
    const isValid = value.length > 0;
    setNameValid(isValid);
    return isValid;
  };

  const validateEmail = (value) => {
    // Add your custom validation logic for the email field
    const isValid = /\S+@\S+\.\S+/.test(value);
    setEmailValid(isValid);
    return isValid;
  };

  const validatePhone = (value) => {
    // Add your custom validation logic for the phone field
    const isValid = value === "" || /^[0-9]{10}$/.test(value);
    setPhoneValid(isValid);
    return isValid;
  };

  const validateMessage = (value) => {
    // Add your custom validation logic for the message field
    const isValid = value.length > 0;
    setMessageValid(isValid);
    return isValid;
  };

  if (
    nameValid &&
    emailValid &&
    phoneValid &&
    messageValid &&
    state.succeeded
  ) {
    setNameValid(false);
    setEmailValid(false);
    setMessageValid(false);
    Swal.fire({
      title: "Message Sent!",
      text: "Thank you for reaching out. I've received your message. I'll get back to you asap.",
      icon: "success",
      timer: 1500,
      confirmButtonColor:"#2ba2a2"
    }).then((result) => {
      if (result.isConfirmed) {
        document.getElementById("contact-form").reset();
      }
    });
  }

  return (
    <div className={styles["contact-section"]} id="contact">
      <div className={styles["container"]}>
        <h2 className={styles.h2}>Contact</h2>
        <div className={styles.gridContainer}>
          <div className={styles.gridItem}>
            <div className={styles["text-wrapper"]}>
              <div className={styles["text-above-image"]}>
                <h3>GET IN TOUCH</h3>
              </div>
              <a
                target="_blank"
                href="https://pngtree.com/freepng/two-people-watching-the-phone_4762502.html"
              >
                <img src={contact} className={styles["contact-image"]} />
              </a>
              <div className={styles["text-below-image"]}>
                <p>
                  Feel free to reach out and start a conversation. Let's connect
                  and explore the possibilities together.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.gridItem}>
            <div className={styles["form-container"]}>
              <form
                onSubmit={handleSubmit}
                id="contact-form"
                className={styles["contact-form"]}
              >
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  placeholder="Name"
                  onChange={(e) => validateName(e.target.value)}
                  // style={{
                  //   borderColor: nameValid ? "green" : "red",
                  // }}
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="Email Address"
                  onChange={(e) => validateEmail(e.target.value)}
                  // style={{
                  //   borderColor: emailValid ? "green" : "red",
                  // }}
                />
                <ValidationError
                  prefix="Email"
                  field="email"
                  errors={state.errors}
                  className={styles["validation-error"]}
                  // style={{
                  //   display: emailValid ? "none" : "block",
                  // }}
                />

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  pattern="[0-9]{10}"
                  placeholder="Phone (optional)"
                  onChange={(e) => validatePhone(e.target.value)}
                  // style={{
                  //   borderColor: phoneValid ? "green" : "red",
                  // }}
                />
                <ValidationError
                  prefix="Phone"
                  field="phone"
                  errors={state.errors}
                  className={styles["validation-error"]}
                  // style={{
                  //   display: phoneValid ? "none" : "block",
                  // }}
                />

                <textarea
                  id="message"
                  name="message"
                  required
                  placeholder="Message"
                  onInput={(e) => validateMessage(e.target.value)}
                  style={{
                    borderColor: messageValid ? "green" : "#a22b2b",
                  }}
                />
                <ValidationError
                  prefix="Message"
                  field="message"
                  errors={state.errors}
                  className={styles["validation-error"]}
                  // style={{
                  //   display: messageValid ? "none" : "block",
                  // }}
                />

                <input
                  name="subject"
                  type="hidden"
                  value={`New submission from {{ name }}`}
                />

                <button type="submit" disabled={state.submitting}>
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactForm;
