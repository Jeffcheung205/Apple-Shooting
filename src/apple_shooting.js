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

  function Apple({ position, isActive, onShot }) {
    const appleRef = useRef();
    const [appleY, setAppleY] = useState(-1);

    useFrame((state, delta) => {
      if (appleRef.current) {
        const targetY = isActive ? 0 : -1;
        setAppleY(current => THREE.MathUtils.lerp(current, targetY, delta * 5));
        appleRef.current.position.y = appleY;
      }
    });

    return React.createElement(
      'group',
      {
        ref: appleRef,
        position: position,
        onClick: onShot
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

  function Bow({ applePosition, onShoot }) {
    const bowRef = useRef();
    const { camera, mouse } = useThree();
    const [isShooting, setIsShooting] = useState(false);
    const shotStartTime = useRef(0);
    const [bowX, setBowX] = useState(0);
    const [bowZ, setBowZ] = useState(0);

    useEffect(() => {
      const handleMouseMove = (event) => {
        const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
        const normalizedY = -(event.clientY / window.innerHeight) * 2 + 1;
        const worldX = normalizedX * 5; // Adjust the multiplier for movement speed
        const worldZ = normalizedY * 5; // Adjust the multiplier for movement speed

        setBowX(worldX);
        setBowZ(worldZ);
      };

      window.addEventListener('mousemove', handleMouseMove);

      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useFrame((state, delta) => {
      if (bowRef.current && applePosition) {
        // Point the bow towards the apple
        const targetPosition = new THREE.Vector3(...applePosition);
        bowRef.current.lookAt(targetPosition); 

        // Shooting animation
        if (isShooting) {
          const elapsedTime = state.clock.getElapsedTime() - shotStartTime.current;
          if (elapsedTime < 0.2) {
            bowRef.current.rotation.x = Math.PI / 2 * Math.sin(elapsedTime * Math.PI / 0.2);
          } else {
            setIsShooting(false);
            bowRef.current.rotation.x = 0;
          }
        }
      }
    });

    const handleClick = () => {
      setIsShooting(true);
      shotStartTime.current = THREE.MathUtils.clamp(THREE.MathUtils.randFloat(0, 1), 0, 1);
      onShoot(); // Trigger the shoot event
    };

    return React.createElement(
      'group',
      { ref: bowRef, onClick: handleClick, position: [bowX, 0, bowZ] },
      React.createElement(BowModel, {
        url: `${assetsUrl}/Bow.glb`,
        scale: [5, 5, 5], // Make the bow smaller
        position: [0, 0, -2],
        rotation: [-Math.PI / 2, 0, 0]
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

  function AppleShooting3D() {
    const [applePosition, setApplePosition] = useState(null);
    const [score, setScore] = useState(0);

    // Update apple position only after a shot
    const updateApplePosition = () => {
      setApplePosition([
        THREE.MathUtils.randFloat(-2, 2), 
        -1, 
        THREE.MathUtils.randFloat(-2, 2) 
      ]);
    };

    const shootApple = () => {
      setScore(prevScore => prevScore + 1);
      updateApplePosition(); // Update apple position after shooting
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      applePosition && React.createElement(Apple, {
        position: applePosition,
        isActive: true,
        onShot: shootApple
      }),
      React.createElement(Bow, {
        applePosition: applePosition,
        onShoot: shootApple
      })
    );
  }

  return AppleShooting3D;
};

console.log('3D Apple Shooting game script loaded');
