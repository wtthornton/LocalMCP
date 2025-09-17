import React from 'react';
import './HelloWorld.css';

interface HelloWorldProps {
  title?: string;
  className?: string;
}

const HelloWorld: React.FC<HelloWorldProps> = ({ 
  title = "Hello World", 
  className = "" 
}) => {
  return (
    <div className={`hello-world ${className}`}>
      <h1 className="hello-world__title">{title}</h1>
      <p className="hello-world__description">
        Welcome to your new HelloWorld component!
      </p>
      <div className="hello-world__actions">
        <button className="hello-world__button hello-world__button--primary">
          Get Started
        </button>
        <button className="hello-world__button hello-world__button--secondary">
          Learn More
        </button>
      </div>
    </div>
  );
};

export default HelloWorld;
