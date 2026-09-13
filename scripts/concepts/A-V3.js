
/* COHERENT TIDES · Study 06. Deterministic geometry; seconds, normalized units. */
(() => {
  'use strict';
  const canvas = document.querySelector('[data-topology-canvas]');
  const backdrop = document.querySelector('[data-tides-backdrop]');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const TAU = Math.PI * 2;
  const CYCLE = 14;
  const TEAL = [143, 217, 210];
  const GOLD = [222, 194, 142];
  const PEARL = [221, 238, 237];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector('[data-motion-toggle]');
  const phaseLabel = document.querySelector('[data-wave-phase]');
  // Fixed irregular Delaunay mesh, with bounded spacing and graph-based signal routes.
  const {nodes, edges, faces} = {"nodes":[{"x":-0.66,"y":0.5,"r":0.8280096617793781,"angle":2.4932606645025324,"role":"coordinator","sector":0,"size":5.7,"localArrival":0.6645130252601145,"sharedArrival":9.812262789181183,"degree":4,"softness":1},{"x":-0.28,"y":0.1,"r":0.2973213749463701,"angle":2.79856871316909,"role":"coordinator","sector":1,"size":5.15,"localArrival":3.2049205132614222,"sharedArrival":8.962792073429638,"degree":6,"softness":1},{"x":-0.6,"y":-0.35,"r":0.6946221994724903,"angle":-2.613518205163434,"role":"coordinator","sector":2,"size":4.9,"localArrival":5.524737810766792,"sharedArrival":9.610673568684353,"degree":6,"softness":1},{"x":0.04,"y":-0.5,"r":0.5015974481593781,"angle":-1.4909663410826592,"role":"coordinator","sector":3,"size":5.2,"localArrival":0.9989226466121197,"sharedArrival":9.706715346080774,"degree":4,"softness":1},{"x":0.48,"y":-0.29,"r":0.5608029957123981,"angle":-0.5434775947130435,"role":"coordinator","sector":4,"size":5.5,"localArrival":4.019337149522029,"sharedArrival":10.333960665470315,"degree":4,"softness":1},{"x":0.66,"y":0.41,"r":0.7769813382572325,"angle":0.5558708091541579,"role":"coordinator","sector":5,"size":4.75,"localArrival":6.540996296864534,"sharedArrival":9.942057972178992,"degree":5,"softness":1},{"x":-0.03,"y":0.04,"r":0.05,"angle":2.214297435588181,"role":"shared","sector":-1,"size":5.4,"localArrival":8.5,"sharedArrival":8.5,"degree":4,"softness":1},{"x":0.188319,"y":0.878219,"r":0.8981828534482567,"angle":1.359562860109004,"role":"agent","sector":5,"size":2.148,"localArrival":5.577379505654255,"sharedArrival":10.19118396494915,"degree":1,"softness":0.72},{"x":0.64195,"y":-0.648027,"r":0.912161715753652,"angle":-0.7901093833720254,"role":"agent","sector":4,"size":2.814,"localArrival":3.268050284161734,"sharedArrival":11.484888829574865,"degree":2,"softness":0.87},{"x":0.914582,"y":-0.293991,"r":0.9606717675701315,"angle":-0.3110165735084503,"role":"agent","sector":4,"size":3.099,"localArrival":3.576006801345158,"sharedArrival":10.998641697179986,"degree":3,"softness":1},{"x":0.244305,"y":0.347871,"r":0.4250867432247311,"angle":0.9585381961651758,"role":"agent","sector":5,"size":3.1,"localArrival":6.138077798969944,"sharedArrival":9.305870870240167,"degree":3,"softness":1},{"x":-0.725126,"y":-0.692821,"r":1.0028999350617165,"angle":-2.3789737906471866,"role":"agent","sector":2,"size":2.802,"localArrival":5.150478210627562,"sharedArrival":10.200364989758741,"degree":3,"softness":1},{"x":-0.435571,"y":0.323283,"r":0.542433636910744,"angle":2.503098504515025,"role":"agent","sector":1,"size":3.58,"localArrival":2.8971032106836576,"sharedArrival":9.249485235236389,"degree":4,"softness":1},{"x":-0.224521,"y":-0.254949,"r":0.3397180668446985,"angle":-2.292817453970654,"role":"agent","sector":1,"size":3.017,"localArrival":2.856541764369389,"sharedArrival":9.139268894613291,"degree":3,"softness":1},{"x":0.725653,"y":0.844351,"r":1.1133291678831287,"angle":0.8608580218233925,"role":"agent","sector":5,"size":1.985,"localArrival":6.122464797526682,"sharedArrival":10.508119379716305,"degree":1,"softness":0.72},{"x":0.460712,"y":0.853438,"r":0.9698514328664246,"angle":1.0757939064143223,"role":"agent","sector":5,"size":2.491,"localArrival":5.5,"sharedArrival":10.313362131771658,"degree":1,"softness":0.72},{"x":-0.932136,"y":0.777725,"r":1.2139739312249278,"angle":2.4462563332248015,"role":"agent","sector":0,"size":2.242,"localArrival":0.25,"sharedArrival":10.354434691741206,"degree":1,"softness":0.72},{"x":0.292373,"y":-0.687925,"r":0.7474774361564747,"angle":-1.1689188798395176,"role":"agent","sector":3,"size":2.446,"localArrival":0.7,"sharedArrival":10.178698472310437,"degree":2,"softness":0.87},{"x":0.17548,"y":0.608751,"r":0.6335385016018867,"angle":1.2901431763478437,"role":"agent","sector":5,"size":2.871,"localArrival":5.868261051564361,"sharedArrival":9.73189731351214,"degree":3,"softness":1},{"x":-0.39447,"y":-0.125317,"r":0.41389710360875587,"angle":-2.833991951288865,"role":"agent","sector":1,"size":4.392,"localArrival":2.953930260962804,"sharedArrival":9.150820149634738,"degree":6,"softness":1},{"x":-0.859695,"y":-0.559826,"r":1.0259048507881252,"angle":-2.56438019398558,"role":"agent","sector":2,"size":2.367,"localArrival":5.198397851870026,"sharedArrival":10.125947187995036,"degree":2,"softness":0.87},{"x":0.88539,"y":0.607906,"r":1.0739950902841713,"angle":0.6016740566422356,"role":"agent","sector":5,"size":2.849,"localArrival":6.256047700573414,"sharedArrival":10.391976808428128,"degree":2,"softness":0.87},{"x":0.785819,"y":-0.480653,"r":0.92116150329392,"angle":-0.5489484806134186,"role":"agent","sector":4,"size":3.288,"localArrival":3.5700757861450003,"sharedArrival":11.00800645802234,"degree":3,"softness":1},{"x":0.460808,"y":0.175319,"r":0.4930317458626945,"angle":0.36354844775712986,"role":"agent","sector":5,"size":2.7,"localArrival":6.2485676227167035,"sharedArrival":9.824521883577386,"degree":2,"softness":0.87},{"x":-0.184332,"y":-0.034991,"r":0.1876240364646073,"angle":-2.953997704120308,"role":"agent","sector":1,"size":4.215,"localArrival":3.0477394417586057,"sharedArrival":8.757380686070805,"degree":6,"softness":1},{"x":-0.593616,"y":-0.548894,"r":0.8084953308086696,"angle":-2.3953179757305514,"role":"agent","sector":2,"size":3.248,"localArrival":5.335691051996881,"sharedArrival":9.90792366128087,"degree":4,"softness":1},{"x":0.801975,"y":-0.637364,"r":1.0244008603146315,"angle":-0.6715273177739702,"role":"agent","sector":4,"size":2.605,"localArrival":3.4204113444522672,"sharedArrival":11.244318734379286,"degree":2,"softness":0.87},{"x":-0.054491,"y":0.229149,"r":0.2355384889948391,"angle":1.8042590838700874,"role":"agent","sector":1,"size":3.4,"localArrival":2.957026814537244,"sharedArrival":8.786091389008794,"degree":4,"softness":1},{"x":0.468667,"y":-0.51139,"r":0.6936629964340943,"angle":-0.8289627296126805,"role":"agent","sector":4,"size":3.189,"localArrival":3.808741430406998,"sharedArrival":10.248949723128536,"degree":3,"softness":1},{"x":-0.580373,"y":-0.133696,"r":0.5955734620396347,"angle":-2.915180551786711,"role":"agent","sector":2,"size":3.228,"localArrival":5.280037091648884,"sharedArrival":9.4299583167741,"degree":3,"softness":1},{"x":0.351659,"y":0.697268,"r":0.7809269948696075,"angle":1.103684162524206,"role":"agent","sector":5,"size":2.801,"localArrival":5.680953300771666,"sharedArrival":10.027646393711134,"degree":2,"softness":0.87},{"x":-0.767681,"y":-0.367515,"r":0.8511173863840668,"angle":-2.6951021935612745,"role":"agent","sector":2,"size":3.676,"localArrival":5.364574485566688,"sharedArrival":9.863563029526622,"degree":4,"softness":1},{"x":1.052907,"y":-0.354117,"r":1.1108605001113447,"angle":-0.324438673605904,"role":"agent","sector":4,"size":2.366,"localArrival":3.4327207651852145,"sharedArrival":11.224882806906212,"degree":2,"softness":0.87},{"x":0.198041,"y":0.084646,"r":0.21537245477295508,"angle":0.40391745949541097,"role":"agent","sector":1,"size":2.227,"localArrival":2.65,"sharedArrival":9.270870569857074,"degree":1,"softness":0.72},{"x":-0.346989,"y":-0.321253,"r":0.4728689253455661,"angle":-2.394689514663897,"role":"agent","sector":2,"size":2.982,"localArrival":5.250411850100922,"sharedArrival":9.453230310701862,"degree":3,"softness":1},{"x":-0.943066,"y":0.525713,"r":1.0796980542742933,"angle":2.6330472787029366,"role":"agent","sector":0,"size":2.473,"localArrival":0.35717268695536664,"sharedArrival":10.144744070866059,"degree":2,"softness":0.87},{"x":-0.455056,"y":0.018929,"r":0.45544964381244785,"angle":3.100020160977566,"role":"agent","sector":1,"size":3.832,"localArrival":3.0216487929170888,"sharedArrival":9.171446696910762,"degree":5,"softness":1},{"x":0.112396,"y":0.776824,"r":0.7849129207667177,"angle":1.4271067826117627,"role":"agent","sector":5,"size":2.53,"localArrival":5.697715566034821,"sharedArrival":10.001179659085098,"degree":2,"softness":0.87},{"x":0.513718,"y":-0.769882,"r":0.9255399954124253,"angle":-0.9823768044890336,"role":"agent","sector":4,"size":2.061,"localArrival":3.1,"sharedArrival":11.750231383514445,"degree":1,"softness":0.72},{"x":-0.28047,"y":0.254245,"r":0.3785545311793939,"angle":2.405199846639338,"role":"agent","sector":1,"size":3.935,"localArrival":3.0583873761933815,"sharedArrival":8.994826026536824,"degree":5,"softness":1},{"x":-0.605083,"y":0.275955,"r":0.6650383304841367,"angle":2.713709629907322,"role":"agent","sector":0,"size":4.043,"localArrival":0.44536921294595816,"sharedArrival":9.513477454839958,"degree":6,"softness":1},{"x":-0.495066,"y":-0.460645,"r":0.6762279388228088,"angle":-2.3921948474537778,"role":"agent","sector":2,"size":3.422,"localArrival":5.379871372093743,"sharedArrival":9.709492337235055,"degree":4,"softness":1},{"x":-0.179074,"y":-0.447471,"r":0.48197252271516655,"angle":-1.951467172666697,"role":"agent","sector":3,"size":2.991,"localArrival":0.7849034351404204,"sharedArrival":9.435989124098773,"degree":3,"softness":1},{"x":0.467613,"y":0.512585,"r":0.6938341975914089,"angle":0.8312467653986614,"role":"agent","sector":5,"size":2.8,"localArrival":6.333869147702407,"sharedArrival":9.824073771766932,"degree":3,"softness":1},{"x":-0.091004,"y":-0.173121,"r":0.19558308173686184,"angle":-2.054767817286585,"role":"agent","sector":1,"size":2.828,"localArrival":2.889371411922165,"sharedArrival":8.832520485113239,"degree":3,"softness":1},{"x":0.931884,"y":-0.504793,"r":1.059822198741784,"angle":-0.49644127435435526,"role":"agent","sector":4,"size":2.231,"localArrival":3.4294316760699832,"sharedArrival":11.230076105509209,"degree":1,"softness":0.72},{"x":-0.444281,"y":0.481739,"r":0.6553308587809401,"angle":2.3157664150069315,"role":"agent","sector":0,"size":3.582,"localArrival":0.4588474403838564,"sharedArrival":9.487527655166039,"degree":4,"softness":1},{"x":-0.477926,"y":0.195521,"r":0.5163732985945662,"angle":2.753263015689307,"role":"agent","sector":1,"size":4.11,"localArrival":2.9961390723451675,"sharedArrival":9.292446980139513,"degree":5,"softness":1},{"x":-0.294933,"y":-0.013583,"r":0.2952454970881624,"angle":-3.095569667358681,"role":"agent","sector":1,"size":3.877,"localArrival":3.0960878531102676,"sharedArrival":8.926360793612428,"degree":5,"softness":1},{"x":0.624036,"y":-0.435316,"r":0.7608682671678729,"angle":-0.6091015282171667,"role":"agent","sector":4,"size":2.745,"localArrival":3.8249628191711302,"sharedArrival":10.508439190466488,"degree":3,"softness":1},{"x":0.929997,"y":-0.143411,"r":0.9409893317474526,"angle":-0.15300091847871322,"role":"agent","sector":4,"size":2.132,"localArrival":3.432208216802881,"sharedArrival":11.225692093825685,"degree":1,"softness":0.72},{"x":0.289703,"y":-0.447171,"r":0.532813160510589,"angle":-0.9959294900766922,"role":"agent","sector":4,"size":3.752,"localArrival":3.784866369716043,"sharedArrival":9.96374364472402,"degree":5,"softness":1},{"x":-0.71743,"y":0.699849,"r":1.0022446202969097,"angle":2.368598749365503,"role":"agent","sector":0,"size":3.859,"localArrival":0.46697292980849536,"sharedArrival":10.011845855201477,"degree":5,"softness":1},{"x":-0.156457,"y":0.157173,"r":0.22177057995354474,"angle":2.353913506496356,"role":"agent","sector":1,"size":3.59,"localArrival":3.075596569015892,"sharedArrival":8.758596371989327,"degree":5,"softness":1},{"x":0.100268,"y":0.221561,"r":0.24319269172671668,"angle":1.1458217329685394,"role":"agent","sector":1,"size":2.782,"localArrival":2.809829082949207,"sharedArrival":9.018508859937272,"degree":3,"softness":1},{"x":-0.058788,"y":-0.330567,"r":0.33575381935934145,"angle":-1.746796782952748,"role":"agent","sector":3,"size":3.454,"localArrival":0.81259996763749,"sharedArrival":9.412521642436621,"degree":4,"softness":1},{"x":0.677709,"y":0.639086,"r":0.9315153808679579,"angle":0.7560750975304608,"role":"agent","sector":5,"size":3.67,"localArrival":6.322715364860217,"sharedArrival":10.191934273400198,"degree":4,"softness":1},{"x":-0.504682,"y":-0.271578,"r":0.5731126227016256,"angle":-2.6479188032401666,"role":"agent","sector":2,"size":4.351,"localArrival":5.40747671685866,"sharedArrival":9.425524473039934,"degree":6,"softness":1},{"x":-0.802512,"y":0.435423,"r":0.9130275693388491,"angle":2.6444675467206116,"role":"agent","sector":0,"size":3.239,"localArrival":0.5158756360750736,"sharedArrival":9.894160466992837,"degree":4,"softness":1},{"x":0.413879,"y":0.345124,"r":0.5388936279685307,"angle":0.6950577798918192,"role":"agent","sector":5,"size":3.423,"localArrival":6.2991949811219845,"sharedArrival":9.560266421006546,"degree":4,"softness":1},{"x":0.823019,"y":-0.364601,"r":0.9001632174513379,"angle":-0.41702064851323944,"role":"agent","sector":4,"size":3.673,"localArrival":3.6858515957375078,"sharedArrival":10.825202548139433,"degree":4,"softness":1},{"x":-0.738905,"y":-0.512519,"r":0.8992529684676436,"angle":-2.5351611138475247,"role":"agent","sector":2,"size":4.133,"localArrival":5.321635493352783,"sharedArrival":9.93136143828542,"degree":5,"softness":1},{"x":-0.828731,"y":-0.671547,"r":1.0666631941582998,"angle":-2.4605836604429396,"role":"agent","sector":2,"size":1.921,"localArrival":5.05,"sharedArrival":10.359014796012788,"degree":1,"softness":0.72},{"x":0.24569,"y":0.513763,"r":0.5694873312492427,"angle":1.1247268096402112,"role":"agent","sector":5,"size":2.815,"localArrival":5.9804747695040845,"sharedArrival":9.554717758870472,"degree":2,"softness":0.87},{"x":-0.266222,"y":-0.146077,"r":0.3036653530226297,"angle":-2.639745313130311,"role":"agent","sector":1,"size":3.843,"localArrival":2.96729751973301,"sharedArrival":8.964391386144419,"degree":5,"softness":1},{"x":1.067936,"y":-0.247893,"r":1.0963290635471683,"angle":-0.2280840340627728,"role":"agent","sector":4,"size":2.262,"localArrival":3.3308031037475256,"sharedArrival":11.38580543022888,"degree":1,"softness":0.72},{"x":-0.659846,"y":-0.245794,"r":0.7041387352801335,"angle":-2.7850137291131363,"role":"agent","sector":2,"size":3.317,"localArrival":5.410577891260727,"sharedArrival":9.6360753687928,"degree":4,"softness":1}],"edges":[{"a":0,"b":40,"type":"relay","events":[{"source":40,"start":0.4454,"duration":0.2191,"kind":"local"}]},{"a":0,"b":46,"type":"relay","events":[{"source":46,"start":0.4588,"duration":0.2057,"kind":"local"},{"source":0,"start":0.6645,"duration":0.2057,"kind":"local"},{"source":46,"start":9.4875,"duration":0.3247,"kind":"collective"}]},{"a":0,"b":52,"type":"relay","events":[{"source":52,"start":0.467,"duration":0.1975,"kind":"local"}]},{"a":0,"b":58,"type":"relay","events":[{"source":58,"start":0.5159,"duration":0.1486,"kind":"local"}]},{"a":1,"b":24,"type":"relay","events":[{"source":24,"start":3.0477,"duration":0.1572,"kind":"local"}]},{"a":1,"b":36,"type":"relay","events":[{"source":36,"start":3.0216,"duration":0.1833,"kind":"local"}]},{"a":1,"b":39,"type":"relay","events":[{"source":39,"start":3.0584,"duration":0.1465,"kind":"local"}]},{"a":1,"b":47,"type":"relay","events":[{"source":47,"start":2.9961,"duration":0.2088,"kind":"local"},{"source":1,"start":8.9628,"duration":0.3297,"kind":"collective"}]},{"a":1,"b":48,"type":"relay","events":[{"source":48,"start":3.0961,"duration":0.1088,"kind":"local"}]},{"a":1,"b":53,"type":"relay","events":[{"source":53,"start":3.0756,"duration":0.1293,"kind":"local"},{"source":1,"start":3.2049,"duration":0.1293,"kind":"local"},{"source":53,"start":8.7586,"duration":0.2042,"kind":"collective"}]},{"a":2,"b":25,"type":"relay","events":[{"source":25,"start":5.3357,"duration":0.189,"kind":"local"}]},{"a":2,"b":31,"type":"relay","events":[{"source":31,"start":5.3646,"duration":0.1602,"kind":"local"},{"source":2,"start":9.6107,"duration":0.2529,"kind":"collective"}]},{"a":2,"b":41,"type":"relay","events":[{"source":41,"start":5.3799,"duration":0.1449,"kind":"local"}]},{"a":2,"b":57,"type":"relay","events":[{"source":57,"start":5.4075,"duration":0.1173,"kind":"local"},{"source":2,"start":5.5247,"duration":0.1173,"kind":"local"},{"source":57,"start":9.4255,"duration":0.1851,"kind":"collective"}]},{"a":2,"b":61,"type":"relay","events":[{"source":61,"start":5.3216,"duration":0.2031,"kind":"local"},{"source":2,"start":9.6107,"duration":0.3207,"kind":"collective"}]},{"a":2,"b":66,"type":"relay","events":[{"source":66,"start":5.4106,"duration":0.1142,"kind":"local"}]},{"a":3,"b":17,"type":"relay","events":[{"source":17,"start":0.7,"duration":0.2989,"kind":"local"},{"source":3,"start":9.7067,"duration":0.472,"kind":"collective"}]},{"a":3,"b":42,"type":"relay","events":[{"source":42,"start":0.7849,"duration":0.214,"kind":"local"}]},{"a":3,"b":51,"type":"peer","events":[]},{"a":3,"b":55,"type":"relay","events":[{"source":55,"start":0.8126,"duration":0.1863,"kind":"local"},{"source":3,"start":0.9989,"duration":0.1863,"kind":"local"},{"source":55,"start":9.4125,"duration":0.2942,"kind":"collective"}]},{"a":4,"b":28,"type":"relay","events":[{"source":28,"start":3.8087,"duration":0.2106,"kind":"local"}]},{"a":4,"b":49,"type":"relay","events":[{"source":49,"start":3.825,"duration":0.1944,"kind":"local"}]},{"a":4,"b":51,"type":"relay","events":[{"source":51,"start":3.7849,"duration":0.2345,"kind":"local"},{"source":4,"start":4.0193,"duration":0.2345,"kind":"local"},{"source":51,"start":9.9637,"duration":0.3702,"kind":"collective"}]},{"a":4,"b":60,"type":"relay","events":[{"source":60,"start":3.6859,"duration":0.3335,"kind":"local"}]},{"a":5,"b":21,"type":"relay","events":[{"source":21,"start":6.256,"duration":0.2849,"kind":"local"},{"source":5,"start":9.9421,"duration":0.4499,"kind":"collective"}]},{"a":5,"b":23,"type":"relay","events":[{"source":23,"start":6.2486,"duration":0.2924,"kind":"local"}]},{"a":5,"b":43,"type":"relay","events":[{"source":43,"start":6.3339,"duration":0.2071,"kind":"local"}]},{"a":5,"b":56,"type":"relay","events":[{"source":56,"start":6.3227,"duration":0.2183,"kind":"local"}]},{"a":5,"b":59,"type":"relay","events":[{"source":59,"start":6.2992,"duration":0.2418,"kind":"local"},{"source":5,"start":6.541,"duration":0.2418,"kind":"local"},{"source":59,"start":9.5603,"duration":0.3818,"kind":"collective"}]},{"a":6,"b":24,"type":"relay","events":[{"source":24,"start":6.0652,"duration":0.163,"kind":"local"},{"source":24,"start":1.6002,"duration":0.163,"kind":"local"},{"source":24,"start":5.0178,"duration":0.163,"kind":"local"},{"source":6,"start":8.5,"duration":0.2574,"kind":"collective"}]},{"a":6,"b":27,"type":"relay","events":[{"source":27,"start":7.2731,"duration":0.1812,"kind":"local"},{"source":6,"start":8.5,"duration":0.2861,"kind":"collective"}]},{"a":6,"b":44,"type":"relay","events":[{"source":6,"start":8.5,"duration":0.3325,"kind":"collective"}]},{"a":6,"b":53,"type":"relay","events":[{"source":53,"start":1.3318,"duration":0.1638,"kind":"local"},{"source":53,"start":3.3342,"duration":0.1638,"kind":"local"},{"source":6,"start":8.5,"duration":0.2586,"kind":"collective"}]},{"a":7,"b":37,"type":"relay","events":[{"source":7,"start":5.5774,"duration":0.1203,"kind":"local"},{"source":37,"start":10.0012,"duration":0.19,"kind":"collective"}],"branch":true,"branchDepth":2,"curve":0.055,"taper":0.6000000000000001},{"a":8,"b":26,"type":"relay","events":[{"source":8,"start":3.2681,"duration":0.1524,"kind":"local"},{"source":26,"start":11.2443,"duration":0.2406,"kind":"collective"}],"branch":true,"branchDepth":1,"curve":-0.055,"taper":0.75},{"a":8,"b":38,"type":"relay","events":[{"source":38,"start":3.1,"duration":0.1681,"kind":"local"},{"source":8,"start":11.4849,"duration":0.2653,"kind":"collective"}],"branch":true,"branchDepth":2,"curve":-0.055,"taper":0.6000000000000001},{"a":9,"b":32,"type":"relay","events":[{"source":32,"start":3.4327,"duration":0.1433,"kind":"local"},{"source":9,"start":10.9986,"duration":0.2262,"kind":"collective"}],"branch":true,"branchDepth":1,"curve":0.055,"taper":0.75},{"a":9,"b":50,"type":"relay","events":[{"source":50,"start":3.4322,"duration":0.1438,"kind":"local"},{"source":9,"start":10.9986,"duration":0.2271,"kind":"collective"}],"branch":true,"branchDepth":2,"curve":0.055,"taper":0.6000000000000001},{"a":9,"b":60,"type":"relay","events":[{"source":9,"start":3.576,"duration":0.1098,"kind":"local"},{"source":60,"start":10.8252,"duration":0.1734,"kind":"collective"}],"branch":true,"branchDepth":0,"curve":0.055,"taper":0.9},{"a":10,"b":54,"type":"relay","events":[{"source":10,"start":6.9439,"duration":0.182,"kind":"local"},{"source":54,"start":9.0185,"duration":0.2874,"kind":"collective"}],"branch":true,"branchDepth":0,"curve":-0.055,"taper":0.9},{"a":10,"b":59,"type":"relay","events":[{"source":10,"start":6.1381,"duration":0.1611,"kind":"local"},{"source":59,"start":6.7828,"duration":0.1611,"kind":"local"},{"source":10,"start":9.3059,"duration":0.2544,"kind":"collective"}],"branch":true,"branchDepth":0,"curve":-0.055,"taper":0.9},{"a":10,"b":63,"type":"relay","events":[{"source":63,"start":5.9805,"duration":0.1576,"kind":"local"},{"source":10,"start":9.3059,"duration":0.2488,"kind":"collective"}],"branch":true,"branchDepth":1,"curve":-0.055,"taper":0.75},{"a":11,"b":25,"type":"relay","events":[{"source":11,"start":5.1505,"duration":0.1852,"kind":"local"},{"source":25,"start":9.9079,"duration":0.2924,"kind":"collective"}]},{"a":11,"b":61,"type":"peer","events":[]},{"a":11,"b":62,"type":"relay","events":[{"source":62,"start":5.05,"duration":0.1005,"kind":"local"},{"source":11,"start":10.2004,"duration":0.1586,"kind":"collective"}],"branch":true,"branchDepth":2,"curve":0.055,"taper":0.6000000000000001},{"a":12,"b":39,"type":"relay","events":[{"source":12,"start":2.8971,"duration":0.1613,"kind":"local"},{"source":12,"start":1.0209,"duration":0.1613,"kind":"local"},{"source":39,"start":8.9948,"duration":0.2547,"kind":"collective"}]},{"a":12,"b":40,"type":"relay","events":[{"source":12,"start":9.2495,"duration":0.264,"kind":"collective"}]},{"a":12,"b":46,"type":"relay","events":[{"source":46,"start":0.8702,"duration":0.1508,"kind":"local"},{"source":12,"start":9.2495,"duration":0.238,"kind":"collective"}]},{"a":12,"b":47,"type":"peer","events":[]},{"a":13,"b":42,"type":"relay","events":[{"source":13,"start":9.1393,"duration":0.2967,"kind":"collective"}]},{"a":13,"b":55,"type":"relay","events":[{"source":55,"start":1.1852,"duration":0.1731,"kind":"local"},{"source":55,"start":4.6029,"duration":0.1731,"kind":"local"},{"source":13,"start":9.1393,"duration":0.2733,"kind":"collective"}]},{"a":13,"b":64,"type":"relay","events":[{"source":13,"start":2.8565,"duration":0.1108,"kind":"local"},{"source":13,"start":1.3583,"duration":0.1108,"kind":"local"},{"source":13,"start":4.776,"duration":0.1108,"kind":"local"},{"source":64,"start":8.9644,"duration":0.1749,"kind":"collective"}],"branch":true,"branchDepth":0,"curve":0.055,"taper":0.9},{"a":14,"b":56,"type":"relay","events":[{"source":14,"start":6.1225,"duration":0.2003,"kind":"local"},{"source":56,"start":10.1919,"duration":0.3162,"kind":"collective"}],"branch":true,"branchDepth":2,"curve":-0.055,"taper":0.6000000000000001},{"a":15,"b":30,"type":"relay","events":[{"source":15,"start":5.5,"duration":0.181,"kind":"local"},{"source":30,"start":10.0276,"duration":0.2857,"kind":"collective"}],"branch":true,"branchDepth":2,"curve":0.055,"taper":0.6000000000000001},{"a":16,"b":52,"type":"relay","events":[{"source":16,"start":0.25,"duration":0.217,"kind":"local"},{"source":52,"start":10.0118,"duration":0.3426,"kind":"collective"}],"branch":true,"branchDepth":2,"curve":-0.055,"taper":0.6000000000000001},{"a":17,"b":51,"type":"peer","events":[]},{"a":18,"b":30,"type":"relay","events":[{"source":30,"start":5.681,"duration":0.1873,"kind":"local"},{"source":18,"start":9.7319,"duration":0.2957,"kind":"collective"}],"branch":true,"branchDepth":1,"curve":-0.055,"taper":0.75},{"a":18,"b":37,"type":"relay","events":[{"source":37,"start":5.6977,"duration":0.1705,"kind":"local"},{"source":18,"start":9.7319,"duration":0.2693,"kind":"collective"}],"branch":true,"branchDepth":1,"curve":-0.055,"taper":0.75},{"a":18,"b":63,"type":"relay","events":[{"source":18,"start":5.8683,"duration":0.1122,"kind":"local"},{"source":63,"start":9.5547,"duration":0.1772,"kind":"collective"}],"branch":true,"branchDepth":1,"curve":-0.055,"taper":0.75},{"a":19,"b":29,"type":"relay","events":[{"source":19,"start":9.1508,"duration":0.2791,"kind":"collective"}]},{"a":19,"b":34,"type":"relay","events":[{"source":19,"start":9.1508,"duration":0.3024,"kind":"collective"}]},{"a":19,"b":36,"type":"peer","events":[]},{"a":19,"b":48,"type":"relay","events":[{"source":19,"start":2.9539,"duration":0.1422,"kind":"local"},{"source":19,"start":5.816,"duration":0.1422,"kind":"local"},{"source":48,"start":8.9264,"duration":0.2245,"kind":"collective"}]},{"a":19,"b":57,"type":"relay","events":[{"source":57,"start":5.642,"duration":0.174,"kind":"local"},{"source":19,"start":9.1508,"duration":0.2747,"kind":"collective"}]},{"a":19,"b":64,"type":"peer","events":[]},{"a":20,"b":31,"type":"peer","events":[]},{"a":20,"b":61,"type":"relay","events":[{"source":20,"start":5.1984,"duration":0.1232,"kind":"local"},{"source":61,"start":9.9314,"duration":0.1946,"kind":"collective"}]},{"a":21,"b":56,"type":"peer","events":[]},{"a":22,"b":26,"type":"relay","events":[{"source":26,"start":3.4204,"duration":0.1497,"kind":"local"},{"source":22,"start":11.008,"duration":0.2363,"kind":"collective"}],"branch":true,"branchDepth":1,"curve":-0.055,"taper":0.75},{"a":22,"b":45,"type":"relay","events":[{"source":45,"start":3.4294,"duration":0.1406,"kind":"local"},{"source":22,"start":11.008,"duration":0.2221,"kind":"collective"}],"branch":true,"branchDepth":2,"curve":-0.055,"taper":0.6000000000000001},{"a":22,"b":60,"type":"relay","events":[{"source":22,"start":3.5701,"duration":0.1158,"kind":"local"},{"source":60,"start":10.8252,"duration":0.1828,"kind":"collective"}],"branch":true,"branchDepth":0,"curve":-0.055,"taper":0.9},{"a":23,"b":59,"type":"relay","events":[{"source":59,"start":9.5603,"duration":0.2643,"kind":"collective"}]},{"a":24,"b":44,"type":"relay","events":[{"source":44,"start":2.8894,"duration":0.1584,"kind":"local"}]},{"a":24,"b":48,"type":"relay","events":[{"source":48,"start":5.9581,"duration":0.107,"kind":"local"},{"source":24,"start":8.7574,"duration":0.169,"kind":"collective"}]},{"a":24,"b":53,"type":"peer","events":[]},{"a":24,"b":64,"type":"relay","events":[{"source":64,"start":1.4691,"duration":0.1311,"kind":"local"},{"source":64,"start":4.8867,"duration":0.1311,"kind":"local"},{"source":24,"start":8.7574,"duration":0.207,"kind":"collective"}]},{"a":25,"b":41,"type":"relay","events":[{"source":41,"start":9.7095,"duration":0.1984,"kind":"collective"}]},{"a":25,"b":61,"type":"peer","events":[]},{"a":27,"b":39,"type":"peer","events":[]},{"a":27,"b":53,"type":"relay","events":[{"source":27,"start":2.957,"duration":0.1186,"kind":"local"}]},{"a":27,"b":54,"type":"relay","events":[{"source":54,"start":2.8098,"duration":0.1472,"kind":"local"},{"source":54,"start":7.1259,"duration":0.1472,"kind":"local"},{"source":27,"start":8.7861,"duration":0.2324,"kind":"collective"}],"branch":true,"branchDepth":0,"curve":0.055,"taper":0.9},{"a":28,"b":49,"type":"relay","events":[{"source":28,"start":10.2489,"duration":0.2595,"kind":"collective"}]},{"a":28,"b":51,"type":"relay","events":[{"source":51,"start":9.9637,"duration":0.2852,"kind":"collective"}]},{"a":29,"b":57,"type":"peer","events":[]},{"a":29,"b":66,"type":"relay","events":[{"source":29,"start":5.28,"duration":0.1305,"kind":"local"},{"source":29,"start":9.43,"duration":0.2061,"kind":"collective"}]},{"a":31,"b":61,"type":"peer","events":[]},{"a":31,"b":66,"type":"peer","events":[]},{"a":32,"b":65,"type":"relay","events":[{"source":65,"start":3.3308,"duration":0.1019,"kind":"local"},{"source":32,"start":11.2249,"duration":0.1609,"kind":"collective"}],"branch":true,"branchDepth":2,"curve":-0.055,"taper":0.6000000000000001},{"a":33,"b":54,"type":"relay","events":[{"source":33,"start":2.65,"duration":0.1598,"kind":"local"},{"source":54,"start":9.0185,"duration":0.2524,"kind":"collective"}],"branch":true,"branchDepth":2,"curve":0.055,"taper":0.6000000000000001},{"a":34,"b":41,"type":"peer","events":[]},{"a":34,"b":57,"type":"relay","events":[{"source":34,"start":5.2504,"duration":0.1571,"kind":"local"}]},{"a":35,"b":52,"type":"peer","events":[]},{"a":35,"b":58,"type":"relay","events":[{"source":35,"start":0.3572,"duration":0.1587,"kind":"local"},{"source":58,"start":9.8942,"duration":0.2506,"kind":"collective"}]},{"a":36,"b":40,"type":"peer","events":[]},{"a":36,"b":47,"type":"peer","events":[]},{"a":36,"b":48,"type":"relay","events":[{"source":48,"start":8.9264,"duration":0.2451,"kind":"collective"}]},{"a":39,"b":47,"type":"peer","events":[]},{"a":39,"b":53,"type":"relay","events":[{"source":39,"start":1.1822,"duration":0.1496,"kind":"local"},{"source":53,"start":8.7586,"duration":0.2362,"kind":"collective"}]},{"a":40,"b":46,"type":"peer","events":[]},{"a":40,"b":47,"type":"peer","events":[]},{"a":40,"b":58,"type":"relay","events":[{"source":40,"start":9.5135,"duration":0.3807,"kind":"collective"}]},{"a":41,"b":57,"type":"relay","events":[{"source":57,"start":9.4255,"duration":0.284,"kind":"collective"}]},{"a":42,"b":55,"type":"peer","events":[]},{"a":43,"b":56,"type":"relay","events":[{"source":43,"start":9.8241,"duration":0.3679,"kind":"collective"}]},{"a":43,"b":59,"type":"relay","events":[{"source":59,"start":9.5603,"duration":0.2638,"kind":"collective"}]},{"a":44,"b":64,"type":"peer","events":[]},{"a":46,"b":52,"type":"relay","events":[{"source":46,"start":9.4875,"duration":0.5243,"kind":"collective"}]},{"a":48,"b":64,"type":"relay","events":[{"source":64,"start":2.9673,"duration":0.1288,"kind":"local"}]},{"a":49,"b":60,"type":"relay","events":[{"source":49,"start":10.5084,"duration":0.3168,"kind":"collective"}]},{"a":51,"b":55,"type":"relay","events":[{"source":51,"start":4.2538,"duration":0.3491,"kind":"local"},{"source":55,"start":9.4125,"duration":0.5512,"kind":"collective"}]},{"a":52,"b":58,"type":"peer","events":[]},{"a":57,"b":66,"type":"peer","events":[]}],"faces":[[0,40,46],[0,40,58],[0,46,52],[0,52,58],[1,24,48],[1,24,53],[1,36,47],[1,36,48],[1,39,47],[1,39,53],[2,25,41],[2,25,61],[2,31,61],[2,31,66],[2,41,57],[2,57,66],[3,17,51],[3,42,55],[3,51,55],[4,28,49],[4,28,51],[4,49,60],[5,21,56],[5,23,59],[5,43,56],[5,43,59],[6,24,44],[6,24,53],[6,27,53],[11,25,61],[12,39,47],[12,40,46],[13,42,55],[19,29,57],[19,34,57],[19,36,48],[19,48,64],[20,31,61],[24,44,64],[24,48,64],[27,39,53],[29,57,66],[34,41,57],[35,52,58],[36,40,47]]};

  const runtime = { time: 0, last: null, raf: 0, width: 600, height: 600, dpr: 1,
    visible: true, paused: reducedMotion.matches, frames: 0, lastPhase: '' };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const smooth = (a, b, x) => { const p = clamp((x-a)/(b-a), 0, 1); return p*p*(3-2*p); };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a,0,1)})`;
  const starts = [0, 2.4, 4.8, .45, 2.85, 5.25];
  const bell = (x, width) => Math.exp(-((x / width) ** 2));

  function localActivity(sector, radius, time, node = null) {
    if (node) return bell((time % CYCLE) - node.localArrival, .48);
    if (sector < 0) return bell((time % CYCLE) - 8.5, .7);
    return bell((time % CYCLE) - (starts[sector] + 1 + Math.max(0, radius - .27) * 1.55), .58);
  }

  function surface(radius, angle, time) {
    // Radial propagation + weak crossing wave: neighbours share a field, not random phases.
    const phase = TAU * time / 7.4 - radius * 5.1;
    const directional = TAU * time / 10.8 - radius * Math.cos(angle + .65) * 3.4;
    const collective = bell((time % CYCLE) - (8.5 + radius * 1.8), .75);
    return .082 * Math.sin(phase) + .023 * Math.sin(directional) + .056 * collective;
  }

  function worldPoint(radius, angle, time, sector = -1, node = null) {
    const collective = bell((time % CYCLE) - (node ? node.sharedArrival : 8.5 + radius * 1.8), .75);
    const local = localActivity(sector, radius, time, node);
    const radial = radius * (1 + .037 * Math.sin(TAU * time / 7.4 - radius * 5.1) + .016 * collective);
    // Reversible torsion, ±1.6 degrees. The silhouette never performs a full rotation.
    const a = angle + .028 * Math.sin(TAU * time / 18) * radius;
    const x = radial * Math.cos(a);
    const y = radial * Math.sin(a);
    const z = .105 * (1 - radius * radius) + surface(radius, angle, time) + .022 * local;
    return {x, y, z, activity: Math.max(local, collective * .75)};
  }

  function project(point, time) {
    // A slightly tilted water plane: retain negative space and make vertical lift readable.
    const roll = -.12 + .043 * Math.sin(TAU * time / 22);
    const tilt = .57 + .045 * Math.sin(TAU * time / 19 + .5);
    const x = point.x * Math.cos(roll) - point.y * Math.sin(roll);
    const y = point.x * Math.sin(roll) + point.y * Math.cos(roll);
    const depth = y * Math.sin(tilt) + point.z * Math.cos(tilt);
    const screenY = y * Math.cos(tilt) - (point.z - .105) * Math.sin(tilt);
    const perspective = 4.8 / (4.8 + depth);
    const scale = Math.min(runtime.width, runtime.height) * .410;
    return {x: runtime.width * .5 + x * scale * perspective,
      y: runtime.height * .53 + screenY * scale * perspective + Math.sin(TAU * time / 12) * scale * .017,
      depth, perspective, activity: point.activity || 0};
  }

  function drawContour(radius, time, alpha, color = TEAL) {
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const a = i * TAU / 120;
      const p = project(worldPoint(radius, a, time), time);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(color, alpha);
    ctx.lineWidth = .7;
    ctx.stroke();
  }

  function drawWaveTraces(time) {
    // Three hairline crests follow the same displaced surface as the spheres.
    for (let i = 0; i < 3; i++) {
      const progress = ((time / 7.4 + i / 3) % 1 + 1) % 1;
      const radius = .1 + progress * 1.2;
      const alpha = Math.sin(progress * Math.PI) ** 2 * .045;
      drawContour(radius, time, alpha);
    }
    // The original backdrop supplies the framing rings; the mesh has no circular outline.
  }

  function edgeControl(edge,a,b) {
    const bend=edge.curve||0;
    return {x:(a.x+b.x)*.5-(b.y-a.y)*bend,y:(a.y+b.y)*.5+(b.x-a.x)*bend};
  }
  function strokeEdge(edge,a,b) {
    ctx.beginPath();ctx.moveTo(a.x,a.y);
    if(edge.branch){const c=edgeControl(edge,a,b);ctx.quadraticCurveTo(c.x,c.y,b.x,b.y);}
    else ctx.lineTo(b.x,b.y);
    ctx.stroke();
  }

  function drawPacket(edge, a, b, time) {
    const phase = time % CYCLE;
    for (const event of edge.events) {
      const progress = (phase - event.start) / event.duration;
      if (progress < 0 || progress > 1) continue;
      const u = event.source === edge.a ? progress : 1-progress;
      const c=edgeControl(edge,a,b), v=1-u;
      const x=v*v*a.x+2*v*u*c.x+u*u*b.x, y=v*v*a.y+2*v*u*c.y+u*u*b.y;
      const color=event.kind==='collective'?GOLD:TEAL;
      const alpha=Math.sin(progress*Math.PI)*.88;
      ctx.strokeStyle=rgba(color,alpha*.5);ctx.lineWidth=1.15;
      strokeEdge(edge,a,b);
      ctx.fillStyle=rgba(color,alpha);ctx.beginPath();ctx.arc(x,y,1.55,0,TAU);ctx.fill();
      const glow=ctx.createRadialGradient(x,y,0,x,y,7);
      glow.addColorStop(0,rgba(color,alpha*.22));glow.addColorStop(1,rgba(color,0));
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,7,0,TAU);ctx.fill();
    }
  }

  function drawSphere(p, node) {
    const unit = clamp(Math.min(runtime.width, runtime.height) / 640, .74, 1.22);
    // Stable size variation follows connectivity and role; activation affects light only.
    const radius = node.size * unit * (1 + (p.perspective - 1) * .35);
    const color = node.role === 'coordinator' ? GOLD : node.role === 'shared' ? PEARL : TEAL;
    const opacity = clamp(.86 - p.depth * .11 + p.activity * .12, .68, 1) * (node.softness || 1);
    window.__maccSphere(ctx,p,radius,color,nodes.indexOf(node)*.79,p.activity,opacity);
  }

  function draw(time) {
    const {width:w, height:h, dpr} = runtime;
    if (backdrop) {
      const breath = Math.sin(TAU * time / 7.4);
      const response = bell((time % CYCLE) - 9.7, 1.2);
      backdrop.style.setProperty('--field-breath', (1 + .005 * breath).toFixed(5));
      backdrop.style.setProperty('--visual-trace-opacity', (.43 + .065 * response).toFixed(3));
      backdrop.style.setProperty('--visual-halo-opacity', (.85 + .12 * response).toFixed(3));
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const ambient = ctx.createRadialGradient(w*.5,h*.48,0,w*.5,h*.48,w*.44);
    ambient.addColorStop(0,'rgba(102,172,170,.065)');
    ambient.addColorStop(.65,'rgba(102,172,170,.023)');
    ambient.addColorStop(1,'rgba(102,172,170,0)');
    ctx.fillStyle=ambient; ctx.fillRect(0,0,w,h);
    drawWaveTraces(time);
    const points = nodes.map(n=>project(worldPoint(n.r,n.angle,time,n.sector,n),time));
    // Sparse translucent facets reinforce the irregular triangular weave.
    faces.forEach((face,i)=>{
      if(i%5!==0)return;
      const a=points[face[0]],b=points[face[1]],c=points[face[2]];
      ctx.fillStyle=rgba(TEAL,.012+Math.max(a.activity,b.activity,c.activity)*.015);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.fill();
    });
    // Local triangulation replaces all concentric membership and radial spokes.
    edges.slice().sort((a,b)=>(points[b.a].depth+points[b.b].depth)-(points[a.a].depth+points[a.b].depth)).forEach(edge=>{
      const a=points[edge.a], b=points[edge.b];
      const near=clamp(.55-(a.depth+b.depth)*.23,0,1);
      const active=Math.max(a.activity,b.activity);
      const warm=nodes[edge.a].role==='coordinator' && nodes[edge.b].role==='coordinator';
      const alpha=edge.branch ? .15+near*.12-edge.branchDepth*.022+active*.09 : .15+near*.15+active*.065;
      ctx.strokeStyle=rgba(warm?GOLD:TEAL,alpha);
      ctx.lineWidth=edge.branch ? edge.taper+near*.12 : .58+near*.2;
      strokeEdge(edge,a,b);
      drawPacket(edge,a,b,time);
    });
    points.map((p,i)=>({p,node:nodes[i]})).sort((a,b)=>b.p.depth-a.p.depth).forEach(({p,node})=>drawSphere(p,node));
    const phase = time % CYCLE;
    const stage = phase < 7.7 ? '01 / Local exchange' : phase < 12 ? '02 / Shared response' : '03 / Settle & renew';
    if (phaseLabel && stage !== runtime.lastPhase) {phaseLabel.textContent=stage; runtime.lastPhase=stage;}
    runtime.frames++;
  }

  function resize() {
    const rect=canvas.getBoundingClientRect();
    runtime.width=Math.max(1,rect.width); runtime.height=Math.max(1,rect.height);
    runtime.dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(runtime.width*runtime.dpr); canvas.height=Math.round(runtime.height*runtime.dpr);
    draw(runtime.time);
  }
  function running() {return !runtime.paused && runtime.visible && document.visibilityState !== 'hidden';}
  function tick(now) {
    runtime.raf=0;
    if (!running()) {runtime.last=null; return;}
    if (runtime.last!==null) runtime.time+=Math.min((now-runtime.last)/1000,.08);
    runtime.last=now; draw(runtime.time);
    runtime.raf=requestAnimationFrame(tick);
  }
  function sync() {
    if (runtime.raf) cancelAnimationFrame(runtime.raf);
    runtime.raf=0; runtime.last=null;
    if (running()) runtime.raf=requestAnimationFrame(tick);
    if (button) {button.textContent=runtime.paused?'Resume motion':'Pause motion'; button.setAttribute('aria-pressed',String(runtime.paused));}
  }
  button?.addEventListener('click',()=>{runtime.paused=!runtime.paused; sync();});
  document.addEventListener('visibilitychange',sync);
  reducedMotion.addEventListener('change',()=>{runtime.paused=reducedMotion.matches; sync(); draw(runtime.time);});
  window.addEventListener('resize',resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry])=>{runtime.visible=entry.isIntersecting;sync();}).observe(canvas);
  // A compact inspection surface for geometry / animation verification, with no UI dependency.
  window.__coherentTides = {
    nodes: nodes.map(n=>({...n})), edges: edges.map(e=>({...e})),
    sample: time=>nodes.map(n=>{const world=worldPoint(n.r,n.angle,time,n.sector,n);return {...project(world,time),world};}),
    get state(){return {time:runtime.time,frames:runtime.frames,paused:runtime.paused,width:runtime.width,height:runtime.height};}
  };
  resize(); sync();
})();

