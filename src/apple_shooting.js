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

  function Apple({ position, isActive, onShoot }) {
    const appleRef = useRef();
    const [appleY, setAppleY] = useState(-1);

    useFrame((state, delta) => {
      if (appleRef.current) {
        const targetY = isActive ? 1 : -1;
        setAppleY(current => THREE.MathUtils.lerp(current, targetY, delta * 5));
        appleRef.current.position.y = appleY;
      }
    });

    return React.createElement(
      'group',
      {
        ref: appleRef,
        position: position,
        onClick: onShoot
      },
      React.createElement(AppleModel, {
        url: `${assetsUrl}/Apple.glb`,
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

    useFrame((state, delta) => {
      if (bowRef.current) {
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        bowRef.current.position.copy(pos);

        // Shooting animation
        if (isShooting) {
          const elapsedTime = state.clock.getElapsedTime() - shootStartTime.current;
          if (elapsedTime < 0.2) {
            bowRef.current.rotation.z = Math.PI / 2 * Math.sin(elapsedTime * Math.PI / 0.2);
          } else {
            setIsShooting(false);
            bowRef.current.rotation.z = 0;
          }
        }
      }
    });

    const handleClick = () => {
      setIsShooting(true);
      shootStartTime.current = THREE.MathUtils.clamp(THREE.MathUtils.randFloat(0, 1), 0, 1);
      onShoot();
    };

    return React.createElement(
      'group',
      { ref: bowRef, onClick: handleClick },
      React.createElement(BowModel, {
        url: `${assetsUrl}/Bow.glb`,
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
  const appleRef = useRef();

  const shootApple = () => {
    setScore(prevScore => prevScore + 1);
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
    React.createElement(Apple, { position: applePosition, onShoot: shootApple }),
    React.createElement(Bow, { onShoot: shootApple }),
    React.createElement(Text, { position: [0, 3, 0], fontSize: 1, color: 'black' }, `Score: ${score}`)
  );
}

  return AppleShootingGame;
};

console.log('3D Apple Shooting game script loaded');
