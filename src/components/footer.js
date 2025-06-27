import React from "react";

const Footer = (props) => {
  return (
    <footer className={`footer ${props.colorTheme}`}>
      <div className={"footer__language"}>
        <ul className={"footer__language-list language-list"}>
          <li className={"language-list__item"}>USA</li>
          <li className={"language-list__item"}>PHL</li>
          <li className={"language-list__item"}>RUS</li>
          <li className={"language-list__item"}>
            Open Source Developers wanted
          </li>
        </ul>
      </div>
      <div className="model-id">originalthread.com/creation_id</div>
    </footer>
  );
};

export default Footer;
