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
  flow: [
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
};

const test1 = {
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
};
// const e2e = R.pipe(
//   prepData
//   assertEPGListing,
//   // TODO: assertLiveScreen,
//   assertLivePlayerScreen,
//   // TODO: assertPlayerScreen
// )(testCases)

// GENERAL UTILITIES
const notNil = R.complement(R.isNil);
const propIsNil = R.propSatisfies(R.isNil);
const propNotNil = R.complement(propIsNil);
const propDefaultArray = R.propOr([]);
const istNotArray = R.complement(Array.isArray);
const listify = R.when(istNotArray, R.append(R.__, []));
const concatUniq = R.curry((uniqueFn, left, right) => {
  return R.pipe(
    R.concat,
    R.uniqBy(uniqueFn)
  )(listify(left), listify(right));
});
const findPropEq = R.curry((k, o, l) => R.find(R.eqProps(k, o), l));
const join = R.join(",");
const guardProp = R.curry((prop, fn) => R.when(propNotNil(prop), fn));

// SPECIFIC UTILITIES
const getAsserts = propDefaultArray("asserts");
const getFlow = propDefaultArray("flow");
const getPrepData = propDefaultArray("prepData");
const getPath = R.propOr("", "path");
const getUrl = R.propOr("", "url");
const getEndPointAndPath = R.pipe(
  R.props(["endpoint", "path"]),
  join
);

const combineListProp = R.curry(
  (prop, id, k, l, r) => (k === prop ? concatUniq(id, l, r) : r)
);

const uniqueFlow = combineListProp("asserts", getPath);
const findUrlEq = findPropEq("url");

const generatePrepData = R.curry((extension, base) =>
  guardProp(
    "prepData",
    R.pipe(
      getPrepData,
      concatUniq(getEndPointAndPath, base)
    )
  )(extension)
);

const mergeAllWith = (fnMerge, fnUniq, list) => {
  return R.reduce((acc, n) => R.pipe(
    findUrlEq(n),
    R.ifElse(
      notNil,
      R.mergeWithKey(fnMerge, n),
      () => {
        return R.identity(n);
      }
    ),
    concatUniq(fnUniq, R.__, acc)
  )(acc), []);
};

const generateFlow = R.curry((extension, base) => {
  return R.pipe(
    getFlow,
    R.concat(base),
    mergeAllWith(uniqueFlow, getUrl)
  )(extension);
});

const generateCase = extension => {
  // algo con zip para para ejecutar cada funcion con extension
  return R.mergeAll([
    base,
    R.objOf("prepData")(generatePrepData(extension, getPrepData(base))),
    R.objOf("flow")(generateFlow(extension, getFlow(base)))
  ]);
};

const testCases = [generateCase(test1)];
console.log("--=-=-=-=-=-=-RESULT=-=-=-=-=-=");
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
