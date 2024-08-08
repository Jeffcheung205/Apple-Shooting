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

  function Apple({ position, isActive, onHit }) {
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
        onClick: onHit
      },
      React.createElement(AppleModel, { 
        url: `${assetsUrl}/Apple.glb`,
        scale: [1, 1, 1],
        position: [0, -0.5, 0]
      })
    );
  }

  const ShooterModel = React.memo(function ShooterModel({ url, scale = [5, 3, 5], position = [0, 0, 0], rotation = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
      copiedScene.rotation.set(...rotation);
    }, [copiedScene, scale, position, rotation]);

    return React.createElement('primitive', { object: copiedScene });
  });

  function Shooter({ apples, setScore, setApples }) {
    const shooterRef = useRef();
    const { camera, mouse } = useThree();

    useFrame(() => {
    if (shooterRef.current) {
      const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));
      shooterRef.current.position.copy(pos);

      // Find the nearest active apple
      const activeApples = apples.map((isActive, index) => isActive ? index : -1).filter(index => index !== -1);
      if (activeApples.length > 0) {
        const nearestAppleIndex = activeApples[0]; // For simplicity, take the first active apple
        const applePosition = new THREE.Vector3(
          (nearestAppleIndex % 3 - 1) * 4,
          0,
          (Math.floor(nearestAppleIndex / 3) - 1) * 4
        );

        const direction = applePosition.sub(shooterRef.current.position).normalize();
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
        shooterRef.current.quaternion.slerp(targetQuaternion, 0.1); // Smooth rotation
      }
    }
  });

  const handleClick = () => {
    const hitIndex = apples.findIndex((isActive) => isActive);
    if (hitIndex !== -1) {
      setScore((prevScore) => prevScore + 1);
      apples[hitIndex] = false; // Deactivate the apple directly
    }
  };

  return React.createElement(
    'group',
    { ref: shooterRef, onClick: handleClick },
    React.createElement(ShooterModel, { 
      url: `${assetsUrl}/shooter.glb`,
      scale: [1, 1, 1],
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

  function AppleShootingGame() {
    const [apples, setApples] = useState(Array(9).fill(false));
    const [score, setScore] = useState(0);

    useEffect(() => {
      const popUpApple = () => {
        setApples(prevApples => {
          const newApples = [...prevApples];
          const inactiveIndices = newApples.reduce((acc, apple, index) => !apple ? [...acc, index] : acc, []);
          if (inactiveIndices.length > 0) {
            const randomIndex = inactiveIndices[Math.floor(Math.random() * inactiveIndices.length)];
            newApples[randomIndex] = true;
          }
          return newApples;
        });
      };

      const popDownApple = () => {
        setApples(prevApples => {
          const newApples = [...prevApples];
          const activeIndices = newApples.reduce((acc, apple, index) => apple ? [...acc, index] : acc, []);
          if (activeIndices.length > 0) {
            const randomIndex = activeIndices[Math.floor(Math.random() * activeIndices.length)];
            newApples[randomIndex] = false;
          }
          return newApples;
        });
      };

      const popUpInterval = setInterval(popUpApple, 1000);
      const popDownInterval = setInterval(popDownApple, 2000);

      return () => {
        clearInterval(popUpInterval);
        clearInterval(popDownInterval);
      };
    }, []);

    const hitApple = (index) => {
      if (apples[index]) {
        setScore(prevScore => prevScore + 1);
        setApples(prevApples => {
          const newApples = [...prevApples];
          newApples[index] = false;
          return newApples;
        });
      }
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      apples.map((isActive, index) => 
        React.createElement(Apple, {
          key: index,
          position: [
            (index % 3 - 1) * 4,
            0,
            (Math.floor(index / 3) - 1) * 4
          ],
          isActive: isActive,
          onHit: () => hitApple(index)
        })
      ),
      React.createElement(Shooter, { apples, setScore, setApples }) 
    );
  }

  return AppleShootingGame; 
};

console.log('3D Apple Shooting game script loaded');
