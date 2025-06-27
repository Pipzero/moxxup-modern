import React, { Component } from "react";
import { IoClose } from "react-icons/io5";
import Player from "./player";

import FabricCanvas from "./fabric-canvas";
import { colorToComplementary } from "../util/color";

import { GithubPicker } from "react-color";
import _, { times } from "lodash";
import CONSTANTS from "../constants";
import Header from "./header";
import Footer from "./footer";

const colorList = [];
_.forOwn(CONSTANTS.MATERIAL_COLORS, (value, key) => {
  _.forOwn(CONSTANTS.MATERIAL_COLORS[key], (value, key) => {
    if (!key.includes("a")) colorList.push(value);
  });
});

class ProductCreator extends Component {
  state = {
    outOfBoundsValue: false,
    isEditorVisible: false,
    isNewText: null,
    isPlayerFront: true,
    isFront: true,
    mainTheme: CONSTANTS.SITE_THEME.Black,
    autoRotate: false,
    isShareMenuVisible: false,
    isPhotoMenuVisible: false,
    isBackroundVisible: false,
  };

  handleShareTrigger = () => this.setState({isShareMenuVisible: !this.state.isShareMenuVisible});

  handlePhotoTrigger = () => this.setState({isPhotoMenuVisible: !this.state.isPhotoMenuVisible});

  handleShowEditor = () => this.setState({ isEditorVisible: true });

  handleHideEditor = () =>
    this.setState({
      isEditorVisible: false,
      isPickerVisible: false,
    });

  handleOutOfBounds = (outOfBoundsValue) => this.setState({ outOfBoundsValue });

  handleAddText = () => {
    if (!this.state.isEditorVisible) {
      this.setState({
        isEditorVisible: true,
        isNewText: new Date().valueOf(),
        autoRotate: false,
      });
    } else {
      this.setState({
        isEditorVisible: false,
      });
    }
  };

  handleColorChange = (activeColor) =>
    this.setState({
      activeColor,
      isPickerVisible: false,
    });

  rotateToFront = (isPlayerFront) =>
    this.setState({ isPlayerFront, isEditorVisible: false }, () =>
      this.player.rotateToFront(isPlayerFront)
    );

  handleUpload = (files) => {
    if (this.state.isFront) {
      this.frontCanvas.processFiles(files);
    } else {
      this.backCanvas.processFiles(files);
    }
    this.setState({isPhotoMenuVisible: !this.state.isPhotoMenuVisible});
  };

  handleTogglePicker = () => this.setState({ isPickerVisible: true });

  handleThemeToggler = () =>
    this.setState({
      mainTheme:
        this.state.mainTheme === CONSTANTS.SITE_THEME.White
          ? CONSTANTS.SITE_THEME.Black
          : CONSTANTS.SITE_THEME.White,
    });


    sceneBackgroundToggler = () => {
      this.setState({
        isBackroundVisible: !this.state.isBackroundVisible,
      })
    }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state.isFront !== prevState.isFront) {
      this.setState((state) => ({ isPlayerFront: state.isFront }));
    }
    return this.state.isBackroundVisible;
  }



  render() {
    const { activeColor = "#212121", isPickerVisible } = this.state;
    const {
      outOfBoundsValue,
      isEditorVisible,
      isNewText,
      isPlayerFront,
    } = this.state;

    return (
      <>
        {this.state.isShareMenuVisible && (
          <div className="share-menu" >
            <IoClose onClick={this.handleShareTrigger}className="close__burger" />
            <ul className="share-list">
              <li className="share-list-item tiktok"></li>
              <li className="share-list-item facebook"></li>
              <li className="share-list-item twitter"></li>
            </ul>
            <h1>proof of creation</h1>
          </div>
        )}

        {this.state.isPhotoMenuVisible && (
          <div className="share-menu">
            <IoClose onClick={this.handlePhotoTrigger}className="close__burger" />
            <ul className="share-list">
              <li
                className="share-list-item screenshot"
                type="button"
                onClick={() => {
                  if (this.state.isFront) {
                    this.frontCanvas && this.frontCanvas.downloadCanvas();
                  } else {
                    this.backCanvas && this.backCanvas.downloadCanvas();
                  }
                  this.handlePhotoTrigger();
                }}
              ></li>
              
              <li className="share-list-item upload-video"></li>
                <label
                  htmlFor="upload"
                  className={`share-list-item upload-photo`}
                ></label>
                <input
                  id="upload"
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => this.handleUpload(e.target.files)}
                />
            </ul>
          </div>
        )}
        <div
          className={this.state.mainTheme}
          style={{ position: "relative", height: "100vh" }}
        >
          <Header
            handleBurgerMenu={this.props.handleBurgerMenu}
            onThemeTogglerChange={() => this.handleThemeToggler()}
            colorTheme={this.state.mainTheme}
            sceneBackgroundToggler={()=> this.sceneBackgroundToggler()}
          />
          <div className="product-creator">
            <div className="product-creator__container">
              <Player
                sceneBackground = {this.state.isBackroundVisible}
                colorTheme={this.state.mainTheme}
                useState={(updater) => this.setState(updater)}  
                onProgress={(loadingPercentage) =>
                  this.setState({ loadingPercentage })
                }
                image={this.state.image}
                ref={(ref) => (this.player = ref)}
                onEditorShow={this.handleShowEditor}
                setImgFront={this.frontCanvas && this.frontCanvas.setImgPreview}
                setImgBack={this.backCanvas && this.backCanvas.setImgPreview}
                setTextAngle={(...args) => {
                  if (this.state.isFront) {
                    this.frontCanvas && this.frontCanvas.setTextAngle(...args);
                  } else {
                    this.backCanvas && this.backCanvas.setTextAngle(...args);
                  }
                }}
                removeActiveTextFront={
                  this.frontCanvas && this.frontCanvas.removeActiveText
                }
                removeActiveTextBack={
                  this.backCanvas && this.backCanvas.removeActiveText
                }
                autoRotate={this.state.autoRotate}
              />
              <div className="product-creator__controls">
                <button
                  type="button"
                  onClick=""
                  className={`product-creator__btn product-creator__btn--wardrobe`}
                ></button>

                <button
                  type="button"
                  onClick={this.handlePhotoTrigger}
                  className={`product-creator__btn product-creator__btn-upload`}
                ></button>
                {/* <button
                type="button"
                onClick={() => {
                  if (this.state.isFront) {
                    this.frontCanvas && this.frontCanvas.downloadCanvas();
                  } else {
                    this.backCanvas && this.backCanvas.downloadCanvas();
                  }
                }}
                className="product-creator__btn product-creator__btn-download"
              ></button> */}
                <button
                  className="product-creator__btn  product-creator__btn-add"
                  onClick={this.handleAddText}
                />
                <button
                  onClick={this.handleTogglePicker}
                  // style={{
                  //     background: activeColor,
                  //     margin: 6,
                  //     width: 46,
                  //     borderRadius: 46,
                  //     height: 46
                  // }}
                  className="product-creator__btn product-creator__btn-color"
                  data-color={isPickerVisible ? activeColor : null}
                >
                  {isPickerVisible && (
                    <GithubPicker
                      width={300}
                      triangle={"hide"}
                      color={activeColor}
                      colors={colorList}
                      onChangeComplete={(color) =>
                        this.handleColorChange(color.hex)
                      }
                    />
                  )}
                </button>
                {/* <button
                type="button"
                onClick={() => this.rotateToFront(!this.state.isPlayerFront)}
                className={`product-creator__btn product-creator__btn--rotate`}
              ></button> */}

                <button
                  type="button"
                  onClick={this.handleShareTrigger}
                  className={`product-creator__btn product-creator__btn--share`}
                ></button>
                {/* <BiShareAlt
                onClick=""
                className="product-creator__btn product-creator__btn--share"
              /> */}
              </div>
            </div>

            <div
              style={
                {
                  //display: "none"
                }
              }
              className={`
                            product-creator__printable-area
                            ${
                              colorToComplementary(activeColor) === "white"
                                ? "light"
                                : ""
                            }
                            ${
                              isEditorVisible && this.state.isFront
                                ? ""
                                : "is-hidden"
                            }
                            `}
              data-size="12” x 16”"
            >
              <FabricCanvas
                activeColor={activeColor}
                onOutOfBounds={this.handleOutOfBounds}
                onEditorShow={this.handleShowEditor}
                onEditorHide={this.handleHideEditor}
                isEditorVisible={isEditorVisible}
                isNewText={isNewText}
                ref={(ref) => {
                  this.frontCanvas = ref;
                }}
                updatePlayer={this.player && this.player.renderFront}
                isFront
                isActive={this.state.isFront}
              />
            </div>
            <div
              style={
                {
                  //display: "none"
                }
              }
              className={`
                            product-creator__printable-area
                            ${
                              colorToComplementary(activeColor) === "white"
                                ? "light"
                                : ""
                            }
                            ${
                              isEditorVisible && !this.state.isFront
                                ? ""
                                : "is-hidden"
                            }
                            `}
              data-size="12” x 16”"
            >
              <FabricCanvas
                activeColor={activeColor}
                onOutOfBounds={this.handleOutOfBounds}
                onEditorShow={this.handleShowEditor}
                onEditorHide={this.handleHideEditor}
                isEditorVisible={isEditorVisible}
                isNewText={isNewText}
                ref={(ref) => {
                  this.backCanvas = ref;
                }}
                updatePlayer={this.player && this.player.renderBack}
                isActive={!this.state.isFront}
              />
            </div>
            {outOfBoundsValue && isEditorVisible && (
              <div className="product-creator__message">
                {`Your graphic is w${outOfBoundsValue}y beyond recommended size.`}
              </div>
            )}
          </div>
          <div className="product__details">
            <p className="product__details--text">
              Creation node: 305 <br />
              Dimensions: CHEST: 58" X LENGTH: 77.5" <br />
              Proof of creation: 4300 + (THC) <br />
              Fabric: Pima <br />
              Rig: Disabled <br />
              Process: 49.00 USD <br />
              Simulation: 50.000 (THC) <br />
              Character upload: Disabled
            </p>
          </div>
          <Footer colorTheme={this.state.mainTheme} />
        </div>
      </>
    );
  }
}

export default ProductCreator;
