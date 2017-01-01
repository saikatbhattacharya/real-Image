const readline = require('readline');
const fs = require('fs');
const _ = require('lodash');
const geoList = require('./geo.json');
const distArray = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const initiator = () => {
    rl.question('Please choose from the given options: \n\n 1. Create a distributor\n 2. Check the GEOs of a distributor/sub-distributor \n 3. Exit \n\nEnter the index number of your chosen option: ', (answer) => {
        switch(answer){
            case '1':
                createDistributor(false);
                break;
            case '2':
                checkGeo();
                break;
            case '3':
                rl.close();
                break;
        }
        
    });
}

const createDistributor = (isSubDistributor, parentName) => {
    rl.question('\nPlease enter the name of the distributor: ', (name) => {
        var distObj = { name: name };
        if (isSubDistributor) {
            distObj.isSubDistributor = true;
            distObj.parent = _.filter(distArray, { 'name': parentName })[0];
        }
        rl.question('\nPlease enter the GEOs to INCLUDE (separated by comma. Geos should be in the following format: CITYCODE-PROVINCECODE-COUNTRYCODE): ', (include) => {
            var goodGeos = getGoodGeos(include, distObj.parent);
            distObj.includeGeo = goodGeos.validGeoArray;
            if (goodGeos.invalidGeo.length) console.log('The following GEOs are invalid: ', goodGeos.invalidGeo);
            rl.question('\nPlease enter the GEOs to EXCLUDE (separated by comma. Geos should be in the following format: CITYCODE-PROVINCECODE-COUNTRYCODE): ', (exclude) => {
                var goodGeosEx = getGoodGeos(exclude);
                distObj.excludeGeo = goodGeosEx.validGeoArray;
                if (goodGeosEx.invalidGeo.length) console.log('The following GEOs are invalid: ', goodGeosEx.invalidGeo);
                distArray.push(distObj);
                rl.question('\nDO you to create a sub-distributor? (yes/no): ', (choice) => {
                    if (choice.toLowerCase() === 'yes') {
                        createDistributor(true, distObj.name);
                    }
                    else {
                        initiator();
                    }
                })
            })
        })
    })
}

const getGoodGeos = (input, parent) => {
    var includeArray = _.map(input.split(','), (each) => { return each.trim() });

    if (parent) {
        var parentGeos = getExplicitGEOs(parent.includeGeo, parent.excludeGeo);
        var validGeoArray = _.filter(includeArray, (each) => { return validateGeo(each, parentGeos) });
        var invalidGeo = _.difference(includeArray, validGeoArray);
        return {
            validGeoArray: validGeoArray,
            invalidGeo: invalidGeo
        }
    }

    else {
        var validGeoArray = _.filter(includeArray, (each) => { return validateGeo(each, geoList) });
        var invalidGeo = _.difference(includeArray, validGeoArray);
        return {
            validGeoArray: validGeoArray,
            invalidGeo: invalidGeo
        }
    }
}

const getExplicitGEOs = (includeArray, excludeArray) => {
    var explicitArrayIn = [];
    var explicitArrayEx = [];
    _.map(includeArray, (each) => {
        validateGeo(each, geoList, (data) => {
            if (data) {
                explicitArrayIn.push(data)
            }
        })
    })

    _.map(excludeArray, (each) => {
        validateGeo(each, geoList, (data) => {
            if (data) {
                explicitArrayEx.push(data)
            }
        })
    })

    var explicitArrayInFlat = [].concat.apply([], explicitArrayIn);
    var explicitArrayExFlat = [].concat.apply([], explicitArrayEx);

    return (_.map(explicitArrayInFlat, (each) => {
        if (_.filter(explicitArrayExFlat, each).length === 0) return each
    })
    )
}

const validateGeo = (inputGeo, geoArray, cb) => {
    const geo = inputGeo.split('-');
    const filterObj = {};

    if (geo[geo.length - 1]) filterObj["Country Code"] = geo[geo.length - 1];
    if (geo[geo.length - 2]) filterObj["Province Code"] = geo[geo.length - 2];
    if (geo[geo.length - 3]) filterObj["City Code"] = geo[geo.length - 3];

    if (_.filter(geoArray, filterObj).length) {
        if (!cb) return true
        else return cb(_.filter(geoArray, filterObj))
    }
    else {
        if (!cb) return false
        else return cb(false)
    }
}

const checkGeo = ()=>{
    rl.question('\nPlease enter the name of the distributor: ', (name) => {
        rl.question('\nPlease enter the region to check: ', (region) => {
            var distObj = _.filter(distArray,{name:name})[0];
            if(getGoodGeos (region, distObj)["invalidGeo"].length) {
                console.log('Sorry, the given GEO is not valid or assigned to the given distributor');
            }
            else {
                console.log('It is a valid region for the distributor.')
            }
            return initiator();
        })
    })
}


initiator();

