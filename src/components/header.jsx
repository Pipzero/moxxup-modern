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
      {/* <GiHamburgerMenu onClick={handleBurgerMenu} className="burger__menu" /> */}
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

      {/* <div className="header__description description"> */}
      {/* <div className="description__title"> */}
      {/* <div className="description__text">
            <div>O</div>
            <div>r</div>
            <div>i</div>
            <div>g</div>
            <div>i</div>
            <div>n</div>
            <div>a</div>
            <div>l</div>
            <div>&nbsp;</div>
            <div>t</div>
            <div>h</div>
            <div>r</div>
            <div>e</div>
            <div>a</div>
            <div>d</div>
          </div> */}
      {/*<div className="description__divider">*/}
      {/*    /*/}
      {/*</div>*/}
      {/*<div className="description__year">*/}
      {/*    2021*/}
      {/*</div>*/}
      {/* </div> */}
      {/* <div className="description__definition">
          Blockchain custom clothier
        </div> */}
      {/* </div> */}
      {/* <div
        className={"header__theme-change-btn " + colorTheme}
        onClick={onThemeTogglerChange}
      ></div> */}
      {/* <Burger /> */}
    </header>
  );
};

export default Header;
