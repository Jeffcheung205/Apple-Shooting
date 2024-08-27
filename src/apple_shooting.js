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

  function Bow() {
    const bowRef = useRef();
    const { camera, mouse } = useThree();
    const [isShooting, setIsShooting] = useState(false);
    const shotStartTime = useRef(0);

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
    };

    return React.createElement(
      'group',
      { ref: bowRef, onClick: handleClick },
      React.createElement(BowModel, {
        url: `${assetsUrl}/Bow.glb`,
        scale: [20, 20, 20],
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

    const shootApple = (index) => {
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
          onShot: () => shootApple(index)
        })
      ),
      React.createElement(Bow)
    );
  }

  return AppleShooting3D;
};

console.log('3D Apple Shooting game script loaded');
