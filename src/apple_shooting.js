window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, Suspense, useMemo } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;
  const { Text } = window.drei; // Import Text from @react-three/drei

  const AppleModel = React.memo(function AppleModel({ url, scale = [1, 1, 1], position = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
    }, [copiedScene, scale, position]);

    return React.createElement('primitive', { object: copiedScene });
  });

  function Apple({ position, onShoot, isActive }) {
    const appleRef = useRef();

    return React.createElement(
      'group',
      {
        ref: appleRef,
        position: position,
        onClick: () => {
          if (isActive) {
            onShoot();
          }
        }
      },
      React.createElement(AppleModel, {
        url: `${assetsUrl}/apple.glb`,
        scale: [0.5, 0.5, 0.5],
        position: [0, -0.5, 0]
      })
    );
  }

  const BowModel = React.memo(function BowModel({ url, scale = [1, 1, 1], position = [0, 0, 0], rotation = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
      copiedScene.rotation.set(...rotation);
    }, [copiedScene, scale, position, rotation]);

    return React.createElement('primitive', { object: copiedScene });
  });

  function Bow({ onShoot }) {
    const bowRef = useRef();
    const { camera, mouse } = useThree();
    const [isShooting, setIsShooting] = useState(false);
    const shootStartTime = useRef(0);

    useFrame((state) => {
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
      setIsShooting(true);
      shootStartTime.current = state.clock.getElapsedTime();
      onShoot();
    };

    return React.createElement(
      'group',
      { ref: bowRef, onClick: handleClick },
      React.createElement(BowModel, {
        url: `${assetsUrl}/bow.glb`,
        scale: [0.5, 0.5, 0.5],
        position: [0, 0, -2],
        rotation: [0, 0, -Math.PI / 2]
      })
    );
  }

  function Camera() {
    const { camera } = useThree();

    useEffect(() => {
      camera.position.set(0, 2, 5);
      camera.lookAt(0, 0, 0);
    }, [camera]);

    return null;
  }

  // Game logic
  function AppleShootingGame() {
    const [applePosition, setApplePosition] = useState([0, 1, 0]);
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState('');
    const [isAppleActive, setIsAppleActive] = useState(true);

    const shootApple = () => {
      if (isAppleActive) {
        setScore(prevScore => prevScore + 1);
        setMessage('Hit!');
        setIsAppleActive(false);
        setTimeout(() => {
          setIsAppleActive(true);
          setApplePosition([
            (Math.random() - 0.5) * 10,
            1 + Math.random(),
            (Math.random() - 0.5) * 10
          ]);
          setMessage(''); 
        }, 1000); 
      } else {
        setMessage('You missed!');
      }
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      React.createElement(Apple, { position: applePosition, onShoot: shootApple, isActive: isAppleActive }),
      React.createElement(Bow, { onShoot: shootApple }),
      React.createElement(Text, { position: [0, 3, 0], fontSize: 1, color: 'black' }, `Score: ${score}`),
      message && React.createElement(Text, { position: [0, 2, 0], fontSize: 1, color: 'red' }, message) // Display message
    );
  }

  return AppleShootingGame;
};

console.log('3D Apple Shooting game script loaded');
