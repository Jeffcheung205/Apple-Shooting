window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, useMemo } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;

  // Apple Model Component
  const AppleModel = React.memo(function AppleModel({ url, scale = [1, 1, 1], position = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
    }, [copiedScene, scale, position]);

    return React.createElement('primitive', { object: copiedScene });
  });

  // Apple Component
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

  // Bow Model Component
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

  // Bow Component
  function Bow({ apples, setScore }) {
    const bowRef = useRef();
    const { camera, mouse } = useThree();

    useFrame(() => {
      if (bowRef.current) {
        // Calculate the direction of the mouse in 3D space
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        bowRef.current.position.copy(pos);

        // Find the nearest active apple
        const activeApples = apples.map((isActive, index) => isActive ? index : -1).filter(index => index !== -1);
        if (activeApples.length > 0) {
          const nearestAppleIndex = activeApples[0]; // For simplicity, take the first active apple
          const applePosition = new THREE.Vector3(
            (nearestAppleIndex % 3 - 1) * 4,
            0,
            (Math.floor(nearestAppleIndex / 3) - 1) * 4
          );

          // Calculate the direction from the bow to the apple
          const direction = applePosition.sub(bowRef.current.position).normalize();
          const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);

          // Smoothly rotate the bow towards the apple
          bowRef.current.quaternion.slerp(targetQuaternion, 0.1); 
        }
      }
    });

    // Handle click event for shooting
    const handleClick = () => {
      const hitIndex = apples.findIndex((isActive) => isActive);
      if (hitIndex !== -1) {
        setScore((prevScore) => prevScore + 1);
        apples[hitIndex] = false; // Deactivate the apple directly
      }
    };

    return React.createElement(
      'group',
      { ref: bowRef, onClick: handleClick },
      React.createElement(BowModel, { 
        url: `${assetsUrl}/Bow.glb`,
        scale: [1, 1, 1],
        position: [0, 0, -2],
        rotation: [-Math.PI / 2, 0, 0]
      })
    );
  }

  // Camera Component
  function Camera() {
    const { camera } = useThree();

    useEffect(() => {
      camera.position.set(0, 10, 15);
      camera.lookAt(0, 0, 0);
    }, [camera]);

    return null;
  }

  // Main Game Component
  function AppleShootingGame() {
    const [apples, setApples] = useState(Array(9).fill(false));
    const [score, setScore] = useState(0);

    useEffect(() => {
      // Function to randomly pop up an apple
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

      // Function to randomly pop down an apple
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

      // Set intervals for popping up and down apples
      const popUpInterval = setInterval(popUpApple, 1000);
      const popDownInterval = setInterval(popDownApple, 2000);

      // Clear intervals on component unmount
      return () => {
        clearInterval(popUpInterval);
        clearInterval(popDownInterval);
      };
    }, []);

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
          onHit: () => {
            if (isActive) {
              setScore(prevScore => prevScore + 1);
              setApples(prevApples => {
                const newApples = [...prevApples];
                newApples[index] = false; // Deactivate the apple
                return newApples;
              });
            }
          }
        })
      ),
      React.createElement(Bow, { apples, setScore })
    );
  }

  return AppleShootingGame;
};
