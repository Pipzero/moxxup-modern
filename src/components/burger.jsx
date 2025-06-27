import React from "react";
import { IoClose } from "react-icons/io5";

const Burger = ({ burgerStatus, closeBurgerMenu }) => {
  return (
    <div className={burgerStatus ? "burgerActive" : "burgerOff"}>
      <IoClose onClick={closeBurgerMenu} className="close__burger" />
      <nav className="burger__navigation">
        <ul className="burger__list">
          <li className="burger__item">Athletic</li>
          <li className="burger__item">Casual</li>
          <li className="burger__item">Corporate</li>
          <li className="burger__item">THC Wallet</li>
          <li className="burger__item">License</li>
          <li className="burger__item">War Stories</li>
        </ul>
      </nav>
      {/* <span></span> */}
    </div>
  );
};

export default Burger;
