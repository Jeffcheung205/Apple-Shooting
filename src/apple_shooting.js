window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, Suspense, useMemo } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;

  const AppleModel = React.memo(function AppleModel({ url, scale = [1, 1, 1], position = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
    }, [copiedScene, scale, position]);

    return React.createElement('primitive', { object: copiedScene });
  });

  function Bow({ onShoot }) {
    const bowRef = useRef();
    const { camera, mouse } = useThree();

    useFrame(() => {
      if (bowRef.current) {
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        bowRef.current.position.copy(pos);
      }
    });

    const handleClick = () => {
      onShoot();
    };

    return React.createElement(
      'group',
      { ref: bowRef, onClick: handleClick },
      React.createElement(AppleModel, { 
        url: `${assetsUrl}/bow.glb`, 
        scale: [1, 1, 1], 
        position: [0, 0, 0] 
      })
    );
  }

  function ShootingApple({ position, isActive, onHit }) {
    const appleRef = useRef();
    const [appleY, setAppleY] = useState(0);

    useFrame((state, delta) => {
      if (appleRef.current) {
        if (isActive) {
          appleRef.current.position.y = THREE.MathUtils.lerp(appleRef.current.position.y, appleY, delta * 5);
        }
      }
    });

    return React.createElement(
      'group',
      { 
        ref: appleRef, 
        position: position, 
        onClick: onHit 
      },
      React.createElement(AppleModel, { 
        url: `${assetsUrl}/apple.glb`, 
        scale: [1, 1, 1], 
        position: [0, 0, 0] 
      })
    );
  }

  function Camera() {
    const { camera } = useThree();
    
    useEffect(() => {
      camera.position.set(0, 10, 15);
      camera.lookAt(0, 0, 0);
    }, [camera]);

    return null;
  }

  function AppleShootingGame() {
    const [score, setScore] = useState(0);
    const [applePosition, setApplePosition] = useState([0, 3, 0]);
    const [isAppleActive, setIsAppleActive] = useState(true);

    const shootApple = () => {
      if (isAppleActive) {
        setScore(prevScore => prevScore + 1);
        setIsAppleActive(false);
        setTimeout(() => {
          setIsAppleActive(true);
          setApplePosition([Math.random() * 10 - 5, 3, Math.random() * 10 - 5]); // Update position randomly
        }, 1000); // Wait before moving the apple again
      }
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      React.createElement(Bow, { onShoot: shootApple }),
      isAppleActive && React.createElement(ShootingApple, { 
        position: applePosition, 
        isActive: isAppleActive, 
        onHit: shootApple 
      }),
      React.createElement('text', { position: [0, 5, 0], fontSize: 1, color: 'black' }, `Score: ${score}`)
    );
  }

  return AppleShootingGame;
};

console.log('3D Apple Shooting game script loaded');
