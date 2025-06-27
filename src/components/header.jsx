import React, { useState } from "react";
import BurgerMenuIcon from "./burger_menu.png";

// import { GiHamburgerMenu } from "react-icons/gi";

const Header = ({ colorTheme, onThemeTogglerChange, handleBurgerMenu, sceneBackgroundToggler }) => {
  
  const [easterToggle, switchEasterToggle] = useState(false);
  var countDown;

  function onEasterMouseDown(){
    countDown = Date.now();
  }
  function onEasterMouseUp(){
    let currentTime = Date.now();

    if((currentTime-countDown) > 3000){
      switchEasterToggle(!easterToggle);
    }else{
      console.log(currentTime-countDown);
    }  
  }


  return (
    <header className={"header " + colorTheme}>
      <img
        src={BurgerMenuIcon}
        onClick={handleBurgerMenu}
        className="burger__menu"
      />
      <div className="header__left">
        <p className="header__text">
          THREADCOINS (THC) <br />
          120750
        </p>

        <div
          className={"header__theme-change-btn " + colorTheme}
          onClick={onThemeTogglerChange}
          onMouseDown={onEasterMouseDown}
          onMouseUp={onEasterMouseUp}
          style={{position: "relative"}}
        ></div>
        <div className={"header__scene-background "} onClick={sceneBackgroundToggler} style={{display:easterToggle ? "flex" : "none"}}>
        </div>
      </div>
    </header>
  );
};

export default Header;
