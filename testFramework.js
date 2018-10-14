"use strict";
const R = require("ramda");
const got = require("got");

const base = {
  name: "Base Name",
  prepData: [
    {
      endpoint: "epglistings",
      path: "streamingAllowed",
      val: "sss"
    },
    {
      endpoint: "epglistings",
      path: "_mediaUrl",
      val: "media.video.url"
    }
  ],
  flow:  [
    {
      url: "epglistings",
      asserts: [
        {
          path: "mediaSourceId",
          expected: null
        },
        {
          path: "mediaSourceUrl",
          expected: null
        },
        {
          path: "livePlayerScreenUrl",
          expected: null
        },
        {
          path: "playerScreenUrl",
          expected: null
        },
        {
          path: "stationId",
          expected: "TestStationId"
        },
        {
          path: "contentAdType",
          expected: "LIVE"
        }
      ]
    },
    {
      url: "liveplayer/:stationId",
      stationId: "123123",
      queryParams: "epgListing=123",
      asserts: [
        {
          path: "contentAdType",
          expected: "LIVE"
        }
      ]
    }
  ]
}


// const e2e = R.pipe(
//   prepData
//   assertEPGListing,
//   // TODO: assertLiveScreen,
//   assertLivePlayerScreen,
//   // TODO: assertPlayerScreen
// )(testCases)

// GENERAL UTILITIES
const notNil = R.complement(R.isNil)
const propIsNil = R.propSatisfies(R.isNil)
const propNotNil = R.complement(propIsNil)
const propDefaultArray = R.propOr([])
const concatUniq = R.curry(
  (fn, a, b) => R.pipe(
    R.concat,
    R.uniqBy(fn)
  )(b, a)
)
const findPropEq = R.curry((k, o, l) => R.find(R.eqProps(k, o), l));
const join = R.join(',')
const guardProp = R.curry((prop, fn) => R.when(propNotNil(prop), fn))

// SPECIFIC UTILITIES
const getAsserts =  propDefaultArray("asserts")
const getFlow = propDefaultArray("flow")
const getPrepData = propDefaultArray("prepData")
const getPath = R.propOr("", "path")
const getEndPointAndPath = R.pipe(
  R.props(["endpoint", "path"]),
  join
)

const concatUniqByPath = concatUniq(getPath)

const uniqueFlow = R.curry((prop, k, l, r) => k === prop ? concatUniqByPath(l, r) : r);

const findUrlEq = findPropEq("url");


const generatePrepData = R.curry((extension, base) =>
  guardProp("prepData",
    R.pipe(
      getPrepData,
      concatUniq(
        getEndPointAndPath,
        base
      )
    )
  )(extension)
)

const generateFlow = R.curry((base, extension) => {
  // Base flow
  // Extension Flow
  // concat Both Flows
  // If it exists in both, merge assets
  // If exists just in one add
  // All of this need to be rethinked
  console.log('((((((((extension))))))))')
  console.log(extension)
  return R.pipe(
    getFlow,
    findUrlEq(base),
    guardProp("asserts",
      R.mergeWithKey(uniqueFlow("asserts"), base)
    )
  )(extension)
});

const mapFlow = (base, extension) => R.map(generateFlow(base), extensions);

const generateCase = extension => {
  // algo con zip para para ejecutar cada funcion con extension
  console.log('(((((ASDF____')
  console.log(generateFlow(getFlow(base), extension))
  console.log('(((((ASDF)))))')
  return R.mergeAll([
    base,
    R.objOf("prepData", generatePrepData(extension, getPrepData(base))),
    R.objOf("flow", generateFlow(getFlow(base), extension)),
  ])
};

const testCases = [
  generateCase({
    name: "Streaming not Allowed",
    prepData: [
      {
        endpoint: "epglistings",
        path: "streamingAllowed",
        val: false
      }
    ],
    flow: [
      {
        url: "epglistings",
        asserts: [
          {
            path: "mediaSourceId",
            expected: "otra cosa"
          }
        ]
      },
      {
        url: "liveplayer/:stationId",
        asserts:
        // null
        [
          {
            path: "contentAdType2",
            expected: "OTRA COSA2"
          }
        ]
      }
    ]
  })
];

console.log(JSON.stringify(testCases, null, 4));

// const putData = ([url, base]) => got.put(url, base)
// const prepData = datas => R.map(putData)

// const assertFlow = (fns) => R.map(R.zip(
//   fetchData,
//   assertData
// ), fns)

// const assertEPGListing = assertFlow([epgListingFetch, epgListingAssert])

// const assertLivePlayerScreen = assertFlow([liveplayerPrep, liveplayerFetch, liveplayerAssert])

// const assertLiveScreen = R.map(R.pipe(
//   prepLiveScreenData,
//   fetchLiveScreenData,
//   assertLiveScreenData
// ))

/* MOCKS */
const baseEPGListing = {
  "@id":
    "https://api-staging.fox.com/fbc-content/_qa_v3/epglistings/272405030622",
  "@type": "EPGListing",
  accounts: ["fox_nation_dcg"],
  approved: true,
  available: "1969-12-31T00:00:00.000Z",
  availabilityByTimeZone: true,
  _availabilityTags: ["foxSubscription"]
};

// Listing a
//  url: test.com?externals=algo,external2=algo2

//  listing_siguiente1
//   materialIDs = [algo2]

//   listing_siguiente2
//   materialIDs = [algo]

//   https://link.theplatform.com/s/fox-dcg/meB86p5Vwp7I
//   ?
//   cguid=945068d7aff74ff59f7b5588c7aea17e
//   allowedprograms=%26repl.prop%2Cval.1%3Dexternal_id%2C34738245515
//   format=redirect
//   formats=JSON%2CM3U%2CText
//   affiliate=FOXNATION-EVENTS
//   auth=y8SXHFmqjw-0REVmZoYysUB8wFB44KCG
// predicate = (url) => {
//   [base, params] = url.split(?)
//   materialIDs = listings.getB2B.map(R.prop('materialIds'))
//   affiliate=listing.callSign

// }
// TODO: Print Variables
// const verifyField = obj => ({ path, predicate, def }) => expected => {
//   const p = predicate || R.identity;
//   return R.path(listify(path), obj) === (expected || def)
// };

// const verifyListing = verifyField(baseEPGListing);

// const createVerifications = (verifications = [], verifyFactory) => {
//   return verifications.reduce((verifiers, v) => {
//     verifiers[v.path] = verifyFactory(v);
//     return verifiers;
//   }, {});
// };

// const listingsVerificationsDefaultsObj = {
//   "approved": {
//     def: true
//   },
//   "available": {
//     def: true
//   }
// };

// const listingsVerificationsDefaults = [
//   {
//     path: "approved",
//     def: true
//   },
//   {
//     path: "available",
//     def: "1969-12-31T00:00:00.000Z"
//   }
// ];

// // First
// const listingsConcrete = [
//   {
//     path: "approved",
//     expected: false
//   }
// ]

// const listify = (itemOrList) => Array.isArray(itemOrList) ? itemOrList : [itemOrList];

// const vu = createVerifications(listingsVerifications, verifyListing);
// Object.entries(vu).map(([k, v]) => {
//   console.log(k, v())
// })

// // // DEFAULT
// // {
// //   approved: true,
// //   available: false
// // }

// // // notApproved
// // {
// //   approved: false
// // }
