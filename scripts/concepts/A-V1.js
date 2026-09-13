
/* COHERENT TIDES · Study 03. Deterministic geometry; seconds, normalized units. */
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
  const {nodes, edges, faces} = {"nodes":[{"x":-0.49,"y":-0.43,"r":0.6519202405202648,"angle":-2.421319653526731,"role":"coordinator","sector":0,"size":4.9,"localArrival":0.7273363651611111,"sharedArrival":9.579267611911611,"degree":7},{"x":0.07,"y":-0.57,"r":0.5742821606144491,"angle":-1.4486011561035415,"role":"coordinator","sector":1,"size":5.12,"localArrival":3.083605954668275,"sharedArrival":9.409347419096703,"degree":6},{"x":0.58,"y":-0.23,"r":0.6239390995922598,"angle":-0.3775301954235382,"role":"coordinator","sector":2,"size":5.34,"localArrival":5.6051906209694815,"sharedArrival":9.482265181514968,"degree":6},{"x":0.45,"y":0.36,"r":0.5762811813689565,"angle":0.6747409422235526,"role":"coordinator","sector":3,"size":4.9,"localArrival":1.190291824409943,"sharedArrival":9.488504387751489,"degree":6},{"x":-0.09,"y":0.51,"r":0.517880295048962,"angle":1.7454685258031364,"role":"coordinator","sector":4,"size":5.12,"localArrival":3.687352401469819,"sharedArrival":9.385841519960511,"degree":5},{"x":-0.61,"y":0.16,"r":0.6306346010171024,"angle":2.88507604094547,"role":"coordinator","sector":5,"size":5.34,"localArrival":5.957303467025711,"sharedArrival":9.46363610151394,"degree":5},{"x":-0.025,"y":0.015,"r":0.0291547594742265,"angle":2.601173153319209,"role":"shared","sector":-1,"size":5.7,"localArrival":8.5,"sharedArrival":8.5,"degree":6},{"x":-0.532893,"y":0.616311,"r":0.8147479494058654,"angle":2.2837336791659686,"role":"agent","sector":4,"size":3.259,"localArrival":3.229840917977607,"sharedArrival":9.778229971442986,"degree":5},{"x":0.92812,"y":0.227004,"r":0.955477804772235,"angle":0.2398755106454926,"role":"agent","sector":3,"size":2.783,"localArrival":0.7,"sharedArrival":10.12297244272667,"degree":4},{"x":-0.938712,"y":-0.212189,"r":0.9623947625812755,"angle":-2.9192863004632077,"role":"agent","sector":0,"size":3.368,"localArrival":0.2506621964896517,"sharedArrival":9.992654155567394,"degree":5},{"x":0.487,"y":-0.699374,"r":0.8522279674780763,"angle":-0.9625331799822495,"role":"agent","sector":1,"size":2.794,"localArrival":2.651004697697633,"sharedArrival":9.897319089543227,"degree":4},{"x":-0.362315,"y":-0.843278,"r":0.9178180256383441,"angle":-1.976599888565221,"role":"agent","sector":0,"size":3.387,"localArrival":0.3076664131688141,"sharedArrival":9.919402990065397,"degree":5},{"x":0.24823,"y":0.862128,"r":0.8971524037415598,"angle":1.2904519299673065,"role":"agent","sector":4,"size":2.672,"localArrival":3.1,"sharedArrival":9.84867925312947,"degree":3},{"x":-0.391493,"y":-0.153463,"r":0.42049660576786574,"angle":-2.7680067857270223,"role":"agent","sector":0,"size":4.072,"localArrival":0.44845600142878417,"sharedArrival":9.146546198302923,"degree":7},{"x":-0.946954,"y":0.404807,"r":1.0298503466847835,"angle":2.7376202410300396,"role":"agent","sector":5,"size":2.822,"localArrival":5.5097577383392204,"sharedArrival":10.170287252071558,"degree":4},{"x":0.183067,"y":-0.883501,"r":0.9022675771967444,"angle":-1.3664810238609235,"role":"agent","sector":1,"size":3.127,"localArrival":2.7670024827274955,"sharedArrival":9.909247637950564,"degree":5},{"x":0.771728,"y":0.576179,"r":0.963092238239194,"angle":0.641327375595452,"role":"agent","sector":3,"size":3.152,"localArrival":0.8220612507120177,"sharedArrival":10.069921083064003,"degree":4},{"x":-0.043462,"y":-0.268314,"r":0.27181109850098767,"angle":-1.7313835096685475,"role":"agent","sector":1,"size":3.904,"localArrival":2.7774049402233674,"sharedArrival":8.925872133131058,"degree":7},{"x":-1.020854,"y":0.115313,"r":1.027346601546003,"angle":3.029111792151511,"role":"agent","sector":5,"size":2.866,"localArrival":5.521005393512354,"sharedArrival":10.13386731571998,"degree":4},{"x":0.949607,"y":-0.278357,"r":0.9895633910149456,"angle":-0.28514135258754875,"role":"agent","sector":2,"size":2.847,"localArrival":5.175797979952665,"sharedArrival":10.160253562067837,"degree":4},{"x":-0.664903,"y":0.404843,"r":0.7784560845061205,"angle":2.5946720530098055,"role":"agent","sector":5,"size":3.519,"localArrival":5.718926077745435,"sharedArrival":9.753994090340765,"degree":6},{"x":-0.684059,"y":-0.697355,"r":0.9768530711990695,"angle":-2.346569834207947,"role":"agent","sector":0,"size":3.169,"localArrival":0.41349397672923927,"sharedArrival":10.074808225225093,"degree":4},{"x":-0.102355,"y":-0.927844,"r":0.9334727705807759,"angle":-1.6806673795797544,"role":"agent","sector":1,"size":2.628,"localArrival":2.7027918997750566,"sharedArrival":9.955009186294696,"degree":3},{"x":-0.281053,"y":0.28072,"r":0.39723321141238216,"angle":2.3567864966334504,"role":"agent","sector":4,"size":4.365,"localArrival":3.4038280774995333,"sharedArrival":9.14886423894212,"degree":8},{"x":-0.088209,"y":0.852076,"r":0.8566296439324514,"angle":1.6739514532752924,"role":"agent","sector":4,"size":3.225,"localArrival":3.3623757531145375,"sharedArrival":9.898962543679376,"degree":5},{"x":0.265612,"y":-0.074368,"r":0.27582659472129484,"angle":-0.2729962108397534,"role":"agent","sector":2,"size":3.743,"localArrival":5.271929875108932,"sharedArrival":8.956064003840417,"degree":6},{"x":0.479001,"y":0.712126,"r":0.8582337134482387,"angle":0.9786728234596666,"role":"agent","sector":3,"size":3.097,"localArrival":0.8546397283894523,"sharedArrival":9.846779595944053,"degree":4},{"x":-0.722826,"y":-0.037042,"r":0.7237747144303365,"angle":-3.0903915737032284,"role":"agent","sector":5,"size":3.986,"localArrival":5.741598548641779,"sharedArrival":9.575657039450615,"degree":7},{"x":-0.283625,"y":-0.60588,"r":0.6689798996715443,"angle":-2.0086168692424753,"role":"agent","sector":0,"size":3.675,"localArrival":0.4697401269891599,"sharedArrival":9.544253726343289,"degree":6},{"x":1.076649,"y":-0.051381,"r":1.0778743360119265,"angle":-0.04768643963345868,"role":"agent","sector":2,"size":2.443,"localArrival":5.05,"sharedArrival":10.28149985492333,"degree":3},{"x":-0.811335,"y":0.582788,"r":0.9989523276686472,"angle":2.5186853564050327,"role":"agent","sector":5,"size":3.061,"localArrival":5.5,"sharedArrival":10.09966684467566,"degree":4},{"x":0.787184,"y":-0.02215,"r":0.7874953828232611,"angle":-0.028130472982103593,"role":"agent","sector":2,"size":3.934,"localArrival":5.326390489150875,"sharedArrival":9.845093819421948,"degree":7},{"x":0.098138,"y":0.288511,"r":0.3047456671244488,"angle":1.2429193365039173,"role":"agent","sector":4,"size":4.338,"localArrival":3.411274315674389,"sharedArrival":8.949928752915095,"degree":8},{"x":-0.242576,"y":-0.380631,"r":0.4513567424087179,"angle":-2.1381905906999013,"role":"agent","sector":0,"size":3.643,"localArrival":0.4876497581392673,"sharedArrival":9.2008150745087,"degree":6},{"x":-0.825957,"y":-0.462186,"r":0.9464783311610905,"angle":-2.6314269206901004,"role":"agent","sector":0,"size":3.061,"localArrival":0.4067157020026222,"sharedArrival":9.957089761484621,"degree":4},{"x":-0.042205,"y":-0.740628,"r":0.7418299894790147,"angle":-1.627719990915382,"role":"agent","sector":1,"size":3.65,"localArrival":2.8896011644202693,"sharedArrival":9.660047189486464,"degree":6},{"x":-0.681969,"y":-0.306593,"r":0.7477174661067889,"angle":-2.719095700291546,"role":"agent","sector":0,"size":3.208,"localArrival":0.5105336862596872,"sharedArrival":9.639098119910178,"degree":5},{"x":0.210986,"y":0.549662,"r":0.5887637576303569,"angle":1.2042923623427415,"role":"agent","sector":4,"size":3.546,"localArrival":3.3989441694451505,"sharedArrival":9.376662143479232,"degree":6},{"x":0.46307,"y":-0.470493,"r":0.6601499131879112,"angle":-0.7933489349404864,"role":"agent","sector":2,"size":3.577,"localArrival":5.351148721759978,"sharedArrival":9.55212666387332,"degree":6},{"x":-0.23588,"y":0.071198,"r":0.24639078690516164,"angle":2.848450114745152,"role":"agent","sector":5,"size":3.655,"localArrival":5.55432816695048,"sharedArrival":8.827359311921471,"degree":6},{"x":0.306001,"y":-0.709395,"r":0.7725787371480456,"angle":-1.1635553286035898,"role":"agent","sector":1,"size":3.474,"localArrival":2.823216766851414,"sharedArrival":9.726269863555824,"degree":5},{"x":0.629915,"y":0.23741,"r":0.6731688145081238,"angle":0.36042915202181197,"role":"agent","sector":3,"size":3.146,"localArrival":0.9834675851797796,"sharedArrival":9.675392045074387,"degree":5},{"x":0.223553,"y":-0.317882,"r":0.3886189851933845,"angle":-0.957886859317578,"role":"agent","sector":1,"size":4.104,"localArrival":2.8031673835451545,"sharedArrival":9.126119239760447,"degree":7},{"x":-0.442541,"y":0.028209,"r":0.4434387601903035,"angle":3.0779360964255087,"role":"agent","sector":5,"size":3.152,"localArrival":5.754858525867916,"sharedArrival":9.143986194422686,"degree":5},{"x":0.775674,"y":-0.581558,"r":0.9694737387202289,"angle":-0.6433378282565969,"role":"agent","sector":2,"size":3.112,"localArrival":5.19454803972777,"sharedArrival":10.049747744946991,"degree":4},{"x":-0.885056,"y":0.227384,"r":0.9137989129856643,"angle":2.8901165352154825,"role":"agent","sector":5,"size":3.549,"localArrival":5.688272811748696,"sharedArrival":9.888421346688174,"degree":6},{"x":-0.260204,"y":0.630487,"r":0.6820700110746473,"angle":1.9622057848628278,"role":"agent","sector":4,"size":3.122,"localArrival":3.4892450952267318,"sharedArrival":9.674445425454651,"degree":5},{"x":-0.916006,"y":-0.029537,"r":0.9164820829676064,"angle":-3.109358918139272,"role":"agent","sector":5,"size":2.952,"localArrival":5.557939293545398,"sharedArrival":9.865645336971216,"degree":4},{"x":-0.178007,"y":-0.13895,"r":0.22581762955911489,"angle":-2.478801574770284,"role":"agent","sector":0,"size":3.394,"localArrival":0.25,"sharedArrival":8.825578614288805,"degree":5},{"x":-0.443834,"y":0.828663,"r":0.9400378902356714,"angle":2.062518161714197,"role":"agent","sector":4,"size":2.888,"localArrival":3.232580033298554,"sharedArrival":10.079706049551774,"degree":4},{"x":0.437339,"y":0.077158,"r":0.4440935986226544,"angle":0.17462855362386295,"role":"agent","sector":3,"size":3.782,"localArrival":0.9213227446635393,"sharedArrival":9.299594567823863,"degree":6},{"x":-0.465635,"y":-0.660619,"r":0.8082287988787141,"angle":-2.1847675170690883,"role":"agent","sector":0,"size":3.15,"localArrival":0.5070287757556637,"sharedArrival":9.8293483695817,"degree":4},{"x":0.111999,"y":-0.201475,"r":0.23051252535540323,"angle":-1.0634367121447217,"role":"agent","sector":1,"size":2.941,"localArrival":2.65,"sharedArrival":8.884276002583887,"degree":4},{"x":0.754588,"y":-0.381697,"r":0.84563365393797,"angle":-0.4683048387179688,"role":"agent","sector":2,"size":3.414,"localArrival":5.385469091588596,"sharedArrival":9.829193912116367,"degree":5},{"x":-0.106768,"y":-0.523872,"r":0.5346413788544458,"angle":-1.7718487714170086,"role":"agent","sector":1,"size":3.129,"localArrival":2.9100526276905088,"sharedArrival":9.320795893933635,"degree":5}],"edges":[{"a":0,"b":13,"type":"relay","events":[{"source":13,"start":0.4485,"duration":0.2789,"kind":"local"}]},{"a":0,"b":21,"type":"relay","events":[{"source":21,"start":0.4135,"duration":0.3138,"kind":"local"},{"source":0,"start":9.5793,"duration":0.4955,"kind":"collective"}]},{"a":0,"b":28,"type":"relay","events":[{"source":28,"start":0.4697,"duration":0.2576,"kind":"local"}]},{"a":0,"b":33,"type":"relay","events":[{"source":33,"start":0.4876,"duration":0.2397,"kind":"local"},{"source":0,"start":0.7273,"duration":0.2397,"kind":"local"},{"source":33,"start":9.2008,"duration":0.3785,"kind":"collective"}]},{"a":0,"b":34,"type":"relay","events":[{"source":34,"start":0.4067,"duration":0.3206,"kind":"local"}]},{"a":0,"b":36,"type":"relay","events":[{"source":36,"start":0.5105,"duration":0.2168,"kind":"local"}]},{"a":0,"b":51,"type":"relay","events":[{"source":51,"start":0.507,"duration":0.2203,"kind":"local"}]},{"a":1,"b":15,"type":"relay","events":[{"source":15,"start":2.767,"duration":0.3166,"kind":"local"},{"source":1,"start":9.4093,"duration":0.4999,"kind":"collective"}]},{"a":1,"b":17,"type":"relay","events":[{"source":17,"start":2.7774,"duration":0.3062,"kind":"local"},{"source":1,"start":3.0836,"duration":0.3062,"kind":"local"},{"source":17,"start":8.9259,"duration":0.4835,"kind":"collective"}]},{"a":1,"b":35,"type":"relay","events":[{"source":35,"start":2.8896,"duration":0.194,"kind":"local"}]},{"a":1,"b":40,"type":"relay","events":[{"source":40,"start":2.8232,"duration":0.2604,"kind":"local"}]},{"a":1,"b":42,"type":"relay","events":[{"source":42,"start":2.8032,"duration":0.2804,"kind":"local"}]},{"a":1,"b":54,"type":"relay","events":[{"source":54,"start":2.9101,"duration":0.1736,"kind":"local"}]},{"a":2,"b":25,"type":"relay","events":[{"source":25,"start":5.2719,"duration":0.3333,"kind":"local"},{"source":2,"start":5.6052,"duration":0.3333,"kind":"local"},{"source":25,"start":8.9561,"duration":0.5262,"kind":"collective"}]},{"a":2,"b":31,"type":"relay","events":[{"source":31,"start":5.3264,"duration":0.2788,"kind":"local"}]},{"a":2,"b":38,"type":"relay","events":[{"source":38,"start":5.3511,"duration":0.254,"kind":"local"}]},{"a":2,"b":42,"type":"peer","events":[]},{"a":2,"b":50,"type":"peer","events":[]},{"a":2,"b":53,"type":"relay","events":[{"source":53,"start":5.3855,"duration":0.2197,"kind":"local"},{"source":2,"start":9.4823,"duration":0.3469,"kind":"collective"}]},{"a":3,"b":16,"type":"relay","events":[{"source":16,"start":0.8221,"duration":0.3682,"kind":"local"},{"source":3,"start":9.4885,"duration":0.5814,"kind":"collective"}]},{"a":3,"b":26,"type":"relay","events":[{"source":26,"start":0.8546,"duration":0.3357,"kind":"local"}]},{"a":3,"b":32,"type":"relay","events":[{"source":3,"start":1.1903,"duration":0.3411,"kind":"local"},{"source":32,"start":8.9499,"duration":0.5386,"kind":"collective"}]},{"a":3,"b":37,"type":"peer","events":[]},{"a":3,"b":41,"type":"relay","events":[{"source":41,"start":0.9835,"duration":0.2068,"kind":"local"}]},{"a":3,"b":50,"type":"relay","events":[{"source":50,"start":0.9213,"duration":0.269,"kind":"local"}]},{"a":4,"b":23,"type":"relay","events":[{"source":23,"start":3.4038,"duration":0.2835,"kind":"local"}]},{"a":4,"b":24,"type":"relay","events":[{"source":24,"start":3.3624,"duration":0.325,"kind":"local"},{"source":4,"start":9.3858,"duration":0.5131,"kind":"collective"}]},{"a":4,"b":32,"type":"relay","events":[{"source":32,"start":3.4113,"duration":0.2761,"kind":"local"},{"source":4,"start":3.6874,"duration":0.2761,"kind":"local"},{"source":32,"start":8.9499,"duration":0.4359,"kind":"collective"}]},{"a":4,"b":37,"type":"relay","events":[{"source":37,"start":3.3989,"duration":0.2884,"kind":"local"}]},{"a":4,"b":46,"type":"relay","events":[{"source":46,"start":3.4892,"duration":0.1981,"kind":"local"}]},{"a":5,"b":20,"type":"relay","events":[{"source":20,"start":5.7189,"duration":0.2384,"kind":"local"}]},{"a":5,"b":23,"type":"peer","events":[]},{"a":5,"b":27,"type":"relay","events":[{"source":27,"start":5.7416,"duration":0.2157,"kind":"local"}]},{"a":5,"b":43,"type":"relay","events":[{"source":43,"start":5.7549,"duration":0.2024,"kind":"local"},{"source":5,"start":5.9573,"duration":0.2024,"kind":"local"},{"source":43,"start":9.144,"duration":0.3196,"kind":"collective"}]},{"a":5,"b":45,"type":"relay","events":[{"source":45,"start":5.6883,"duration":0.269,"kind":"local"},{"source":5,"start":9.4636,"duration":0.4248,"kind":"collective"}]},{"a":6,"b":17,"type":"relay","events":[{"source":17,"start":3.3898,"duration":0.2697,"kind":"local"},{"source":6,"start":8.5,"duration":0.4259,"kind":"collective"}]},{"a":6,"b":25,"type":"relay","events":[{"source":25,"start":5.9385,"duration":0.2888,"kind":"local"},{"source":6,"start":8.5,"duration":0.4561,"kind":"collective"}]},{"a":6,"b":32,"type":"relay","events":[{"source":32,"start":1.5314,"duration":0.285,"kind":"local"},{"source":32,"start":3.9634,"duration":0.285,"kind":"local"},{"source":6,"start":8.5,"duration":0.4499,"kind":"collective"}]},{"a":6,"b":39,"type":"relay","events":[{"source":39,"start":6.3603,"duration":0.2073,"kind":"local"},{"source":6,"start":8.5,"duration":0.3274,"kind":"collective"}]},{"a":6,"b":48,"type":"relay","events":[{"source":48,"start":1.2047,"duration":0.2062,"kind":"local"},{"source":6,"start":8.5,"duration":0.3256,"kind":"collective"}]},{"a":6,"b":52,"type":"relay","events":[{"source":6,"start":8.5,"duration":0.3843,"kind":"collective"}]},{"a":7,"b":20,"type":"peer","events":[]},{"a":7,"b":23,"type":"relay","events":[{"source":23,"start":9.1489,"duration":0.6294,"kind":"collective"}]},{"a":7,"b":30,"type":"peer","events":[]},{"a":7,"b":46,"type":"relay","events":[{"source":7,"start":3.2298,"duration":0.2594,"kind":"local"}]},{"a":7,"b":49,"type":"peer","events":[]},{"a":8,"b":16,"type":"peer","events":[]},{"a":8,"b":29,"type":"peer","events":[]},{"a":8,"b":31,"type":"peer","events":[]},{"a":8,"b":41,"type":"relay","events":[{"source":8,"start":0.7,"duration":0.2835,"kind":"local"},{"source":41,"start":9.6754,"duration":0.4476,"kind":"collective"}]},{"a":9,"b":18,"type":"peer","events":[]},{"a":9,"b":27,"type":"relay","events":[{"source":27,"start":9.5757,"duration":0.417,"kind":"collective"}]},{"a":9,"b":34,"type":"peer","events":[]},{"a":9,"b":36,"type":"relay","events":[{"source":9,"start":0.2507,"duration":0.2599,"kind":"local"}]},{"a":9,"b":47,"type":"peer","events":[]},{"a":10,"b":15,"type":"peer","events":[]},{"a":10,"b":38,"type":"relay","events":[{"source":38,"start":9.5521,"duration":0.3452,"kind":"collective"}]},{"a":10,"b":40,"type":"relay","events":[{"source":10,"start":2.651,"duration":0.1722,"kind":"local"}]},{"a":10,"b":44,"type":"peer","events":[]},{"a":11,"b":21,"type":"peer","events":[]},{"a":11,"b":22,"type":"peer","events":[]},{"a":11,"b":28,"type":"relay","events":[{"source":28,"start":9.5443,"duration":0.3751,"kind":"collective"}]},{"a":11,"b":35,"type":"peer","events":[]},{"a":11,"b":51,"type":"relay","events":[{"source":11,"start":0.3077,"duration":0.1994,"kind":"local"}]},{"a":12,"b":24,"type":"peer","events":[]},{"a":12,"b":26,"type":"peer","events":[]},{"a":12,"b":37,"type":"relay","events":[{"source":12,"start":3.1,"duration":0.2989,"kind":"local"},{"source":37,"start":9.3767,"duration":0.472,"kind":"collective"}]},{"a":13,"b":27,"type":"peer","events":[]},{"a":13,"b":33,"type":"peer","events":[]},{"a":13,"b":36,"type":"relay","events":[{"source":13,"start":9.1465,"duration":0.4926,"kind":"collective"}]},{"a":13,"b":39,"type":"peer","events":[]},{"a":13,"b":43,"type":"peer","events":[]},{"a":13,"b":48,"type":"relay","events":[{"source":48,"start":8.8256,"duration":0.321,"kind":"collective"}]},{"a":14,"b":18,"type":"peer","events":[]},{"a":14,"b":20,"type":"peer","events":[]},{"a":14,"b":30,"type":"peer","events":[]},{"a":14,"b":45,"type":"relay","events":[{"source":14,"start":5.5098,"duration":0.1785,"kind":"local"},{"source":45,"start":9.8884,"duration":0.2819,"kind":"collective"}]},{"a":15,"b":22,"type":"peer","events":[]},{"a":15,"b":35,"type":"peer","events":[]},{"a":15,"b":40,"type":"peer","events":[]},{"a":16,"b":26,"type":"peer","events":[]},{"a":16,"b":41,"type":"peer","events":[]},{"a":17,"b":33,"type":"peer","events":[]},{"a":17,"b":42,"type":"peer","events":[]},{"a":17,"b":48,"type":"peer","events":[]},{"a":17,"b":52,"type":"peer","events":[]},{"a":17,"b":54,"type":"relay","events":[{"source":17,"start":8.9259,"duration":0.3949,"kind":"collective"}]},{"a":18,"b":45,"type":"relay","events":[{"source":18,"start":5.521,"duration":0.1673,"kind":"local"}]},{"a":18,"b":47,"type":"relay","events":[{"source":47,"start":9.8656,"duration":0.2682,"kind":"collective"}]},{"a":19,"b":29,"type":"peer","events":[]},{"a":19,"b":31,"type":"peer","events":[]},{"a":19,"b":44,"type":"peer","events":[]},{"a":19,"b":53,"type":"relay","events":[{"source":19,"start":5.1758,"duration":0.2097,"kind":"local"},{"source":53,"start":9.8292,"duration":0.3311,"kind":"collective"}]},{"a":20,"b":23,"type":"relay","events":[{"source":23,"start":9.1489,"duration":0.6051,"kind":"collective"}]},{"a":20,"b":30,"type":"relay","events":[{"source":30,"start":5.5,"duration":0.2189,"kind":"local"},{"source":20,"start":9.754,"duration":0.3457,"kind":"collective"}]},{"a":20,"b":45,"type":"peer","events":[]},{"a":21,"b":34,"type":"peer","events":[]},{"a":21,"b":51,"type":"peer","events":[]},{"a":22,"b":35,"type":"relay","events":[{"source":22,"start":2.7028,"duration":0.1868,"kind":"local"},{"source":35,"start":9.66,"duration":0.295,"kind":"collective"}]},{"a":23,"b":32,"type":"peer","events":[]},{"a":23,"b":39,"type":"relay","events":[{"source":39,"start":8.8274,"duration":0.3215,"kind":"collective"}]},{"a":23,"b":43,"type":"peer","events":[]},{"a":23,"b":46,"type":"relay","events":[{"source":23,"start":9.1489,"duration":0.5256,"kind":"collective"}]},{"a":24,"b":37,"type":"peer","events":[]},{"a":24,"b":46,"type":"peer","events":[]},{"a":24,"b":49,"type":"peer","events":[]},{"a":25,"b":32,"type":"peer","events":[]},{"a":25,"b":42,"type":"peer","events":[]},{"a":25,"b":50,"type":"relay","events":[{"source":25,"start":8.9561,"duration":0.3435,"kind":"collective"}]},{"a":25,"b":52,"type":"peer","events":[]},{"a":26,"b":37,"type":"relay","events":[{"source":37,"start":9.3767,"duration":0.4701,"kind":"collective"}]},{"a":27,"b":36,"type":"peer","events":[]},{"a":27,"b":43,"type":"relay","events":[{"source":43,"start":9.144,"duration":0.4317,"kind":"collective"}]},{"a":27,"b":45,"type":"peer","events":[]},{"a":27,"b":47,"type":"relay","events":[{"source":47,"start":5.5579,"duration":0.1837,"kind":"local"},{"source":27,"start":9.5757,"duration":0.29,"kind":"collective"}]},{"a":28,"b":33,"type":"relay","events":[{"source":33,"start":9.2008,"duration":0.3434,"kind":"collective"}]},{"a":28,"b":35,"type":"peer","events":[]},{"a":28,"b":51,"type":"relay","events":[{"source":28,"start":9.5443,"duration":0.2851,"kind":"collective"}]},{"a":28,"b":54,"type":"peer","events":[]},{"a":29,"b":31,"type":"relay","events":[{"source":29,"start":5.05,"duration":0.2764,"kind":"local"},{"source":31,"start":9.8451,"duration":0.4364,"kind":"collective"}]},{"a":30,"b":49,"type":"peer","events":[]},{"a":31,"b":41,"type":"peer","events":[]},{"a":31,"b":50,"type":"relay","events":[{"source":50,"start":9.2996,"duration":0.5455,"kind":"collective"}]},{"a":31,"b":53,"type":"peer","events":[]},{"a":32,"b":37,"type":"relay","events":[{"source":32,"start":8.9499,"duration":0.4267,"kind":"collective"}]},{"a":32,"b":39,"type":"peer","events":[]},{"a":32,"b":50,"type":"peer","events":[]},{"a":33,"b":48,"type":"relay","events":[{"source":48,"start":0.25,"duration":0.2376,"kind":"local"},{"source":33,"start":0.967,"duration":0.2376,"kind":"local"},{"source":48,"start":8.8256,"duration":0.3752,"kind":"collective"}]},{"a":33,"b":54,"type":"peer","events":[]},{"a":34,"b":36,"type":"relay","events":[{"source":36,"start":9.6391,"duration":0.318,"kind":"collective"}]},{"a":35,"b":54,"type":"relay","events":[{"source":54,"start":9.3208,"duration":0.3393,"kind":"collective"}]},{"a":38,"b":40,"type":"peer","events":[]},{"a":38,"b":42,"type":"relay","events":[{"source":42,"start":9.1261,"duration":0.426,"kind":"collective"}]},{"a":38,"b":44,"type":"relay","events":[{"source":38,"start":9.5521,"duration":0.4976,"kind":"collective"}]},{"a":38,"b":53,"type":"peer","events":[]},{"a":39,"b":43,"type":"relay","events":[{"source":39,"start":5.5543,"duration":0.2005,"kind":"local"},{"source":43,"start":6.1597,"duration":0.2005,"kind":"local"},{"source":39,"start":8.8274,"duration":0.3166,"kind":"collective"}]},{"a":39,"b":48,"type":"peer","events":[]},{"a":40,"b":42,"type":"relay","events":[{"source":42,"start":9.1261,"duration":0.6002,"kind":"collective"}]},{"a":41,"b":50,"type":"relay","events":[{"source":50,"start":9.2996,"duration":0.3758,"kind":"collective"}]},{"a":42,"b":52,"type":"relay","events":[{"source":52,"start":2.65,"duration":0.1532,"kind":"local"},{"source":52,"start":8.8843,"duration":0.2418,"kind":"collective"}]},{"a":44,"b":53,"type":"relay","events":[{"source":44,"start":5.1945,"duration":0.1909,"kind":"local"}]},{"a":45,"b":47,"type":"peer","events":[]},{"a":46,"b":49,"type":"relay","events":[{"source":49,"start":3.2326,"duration":0.2567,"kind":"local"},{"source":46,"start":9.6744,"duration":0.4053,"kind":"collective"}]}],"faces":[[0,13,33],[0,13,36],[0,21,34],[0,21,51],[0,28,33],[0,28,51],[0,34,36],[1,15,35],[1,15,40],[1,17,42],[1,17,54],[1,35,54],[1,40,42],[2,25,42],[2,25,50],[2,31,50],[2,31,53],[2,38,42],[2,38,53],[3,16,26],[3,16,41],[3,26,37],[3,32,37],[3,32,50],[3,41,50],[4,23,32],[4,23,46],[4,24,37],[4,24,46],[4,32,37],[5,20,23],[5,20,45],[5,23,43],[5,27,43],[5,27,45],[6,17,48],[6,17,52],[6,25,32],[6,25,52],[6,32,39],[6,39,48],[7,20,23],[7,20,30],[7,23,46],[7,30,49],[7,46,49],[8,16,41],[8,29,31],[8,31,41],[9,18,47],[9,27,36],[9,27,47],[9,34,36],[10,15,40],[10,38,40],[10,38,44],[11,21,51],[11,22,35],[11,28,35],[11,28,51],[12,24,37],[12,26,37],[13,27,36],[13,27,43],[13,33,48],[13,39,43],[13,39,48],[14,18,45],[14,20,30],[14,20,45],[15,22,35],[17,33,48],[17,33,54],[17,42,52],[18,45,47],[19,29,31],[19,31,53],[19,44,53],[23,32,39],[23,39,43],[24,46,49],[25,32,50],[25,42,52],[27,45,47],[28,33,54],[28,35,54],[31,41,50],[38,40,42],[38,44,53]]};

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
    const scale = Math.min(runtime.width, runtime.height) * .397;
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

  function drawPacket(edge, a, b, time) {
    const phase = time % CYCLE;
    for (const event of edge.events) {
      const progress = (phase - event.start) / event.duration;
      if (progress < 0 || progress > 1) continue;
      const u = event.source === edge.a ? progress : 1-progress;
      const x=a.x+(b.x-a.x)*u, y=a.y+(b.y-a.y)*u;
      const color=event.kind==='collective'?GOLD:TEAL;
      const alpha=Math.sin(progress*Math.PI)*.88;
      ctx.strokeStyle=rgba(color,alpha*.5);ctx.lineWidth=1.15;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
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
    const opacity = clamp(.86 - p.depth * .11 + p.activity * .12, .68, 1);
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
      const alpha=.12+near*.14+active*.065;
      ctx.strokeStyle=rgba(warm?GOLD:TEAL,alpha);
      ctx.lineWidth=.58+near*.2;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      drawPacket(edge,a,b,time);
    });
    points.map((p,i)=>({p,node:nodes[i]})).sort((a,b)=>b.p.depth-a.p.depth).forEach(({p,node})=>drawSphere(p,node));
    const phase = time % CYCLE;
    const stage = phase < 7.7 ? '01 / Local exchange' : phase < 11.5 ? '02 / Shared response' : '03 / Settle & renew';
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

