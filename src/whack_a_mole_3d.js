window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, Suspense } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;

  const AppleModel = React.memo(function AppleModel({ url, position }) {
    const gltf = useLoader(GLTFLoader, url);
    return React.createElement('primitive', { object: gltf.scene, position });
  });

  const BowModel = React.memo(function BowModel({ url, position, onClick }) {
    const gltf = useLoader(GLTFLoader, url);
    return React.createElement('primitive', { object: gltf.scene, position, onClick });
  });

  function Apple({ position, onShoot }) {
    return React.createElement(AppleModel, { url: `${assetsUrl}/Apple.glb`, position });
  }

  function Bow({ onShoot }) {
    return React.createElement(BowModel, { url: `${assetsUrl}/Bow.glb`, position: [0, 0, -2], onClick: onShoot });
  }

  function Camera() {
    const { camera } = useThree();
    
    useEffect(() => {
      camera.position.set(0, 2, 5);
      camera.lookAt(0, 0, 0);
    }, [camera]);

    return null;
  }

  function AppleShootingGame() {
    const [applePosition, setApplePosition] = useState([0, 1, 0]);
    const [score, setScore] = useState(0);
    const appleRef = useRef();

    const shootApple = () => {
      setScore(prevScore => prevScore + 1);
      // Move the apple to a new random position
      const newPosition = [
        (Math.random() - 0.5) * 10,
        1 + Math.random(),
        (Math.random() - 0.5) * 10
      ];
      setApplePosition(newPosition);
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      React.createElement(Apple, { position: applePosition, ref: appleRef }),
      React.createElement(Bow, { onShoot: shootApple }),
      React.createElement('text', { position: [0, 3, 0], fontSize: 1, color: 'black' }, `Score: ${score}`)
    );
  }

  return AppleShootingGame;
};

console.log('3D Apple Shooting game script loaded');
