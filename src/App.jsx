import { useState } from 'react';
import Burger from './components/Burger';
import ProductCreator from './components/ProductCreator';

import './App.scss' // or SCSS if you prefer

export default function App() {
  const [isBurgerShown, setIsBurgerShown] = useState(false);

  return (
    <div className="app">
      <Burger
        burgerStatus={isBurgerShown}
        closeBurgerMenu={() => setIsBurgerShown(false)}
      />
      <ProductCreator handleBurgerMenu={() => setIsBurgerShown(true)} />
    </div>
  );
}
