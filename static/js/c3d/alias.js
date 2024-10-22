// aliases
let Scene = THREE.Scene,
    PerspectiveCamera = THREE.PerspectiveCamera,
    AudioListener = THREE.AudioListener,
    Audio = THREE.Audio,
    AudioLoader = THREE.AudioLoader,
    PositionalAudio = THREE.PositionalAudio,
    WebGLRenderer = THREE.WebGLRenderer,
    BoxGeometry = THREE.BoxGeometry,
    MeshBasicMaterial = THREE.MeshBasicMaterial,
    MeshLambertMaterial = THREE.MeshLambertMaterial,
    MeshPhongMaterial = THREE.MeshPhongMaterial,
		ShaderMaterial = THREE.ShaderMaterial,
		DataTexture = THREE.DataTexture,
    TextureLoader = THREE.TextureLoader,
		OBJLoader = THREE.OBJLoader,
		MTLLoader = THREE.MTLLoader,
		GLTFLoader = THREE.GLTFLoader,
    FirstPersonControls = THREE.FirstPersonControls,
    Clock = THREE.Clock,
    Vector2 = THREE.Vector2,
    Vector3 = THREE.Vector3,
    Vector4 = THREE.Vector4,
    Euler = THREE.Euler,
		Quaternion = THREE.Quaternion,
    Mesh = THREE.Mesh,
    AmbientLight = THREE.AmbientLight,
    DirectionalLight = THREE.DirectionalLight,
		HemisphereLight = THREE.HemisphereLight,
    width = window.innerWidth,
    height = window.innerHeight;