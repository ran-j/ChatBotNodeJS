// TODO OPTIMIZE THIS Class
module.exports = new class SysFunctions {

    async zeroTest(myArray) {
        var flag = false;
        for (var i = 0; i < myArray.length; ++i) {
            if (myArray[i] !== 0) {
                flag = true;
                break;
            }
        }
        return flag
    }

    random(A) {
        return A[Math.floor(Math.random() * A.length)]
    }

    UserFilter(arr1, toFind) {
        return arr1.find(val => Array.isArray(val) ? UserFilter(val, toFind) : val.uID === toFind) !== undefined;
    }

    hasKey(key, A) {
        if (A[key] != undefined && A[key] != null && A[key].length > 0) {
            return true;
        }
        return false;
    }

    len(A) {
        return A.length;
    }

    ContainsStringInArray(A, value) {
        return A.indexOf(value) > -1;
    }

    sort(A) {
        var uniqueNames = A.filter(function (item, pos) {
            return A.indexOf(item) == pos;
        });
        return uniqueNames;
    }

    NotcontainsinPattern_words(A, B) {
        var otp = false;
        for (var i = 0; i < A.length; i++) {
            for (var ii = 0; ii < B.length; ii++) {
                if (A[i] == B[ii]) {
                    otp = true;
                }
            }
        }
        return otp;
    }

    ignore_wordsFilter(wd, igwords) {
        return wd.filter((word, index, array) => igwords.indexOf(word) < 0);
    }

    multiDimensionalUnique(arr) {
        var uniques = [];
        var itemsFound = {};
        for (var i = 0, l = arr.length; i < l; i++) {
            var stringified = JSON.stringify(arr[i]);
            if (itemsFound[stringified]) { continue; }
            uniques.push(arr[i]);
            itemsFound[stringified] = true;
        }
        return uniques;
    }

    toOneArray(arrToConvert) {
        var newArr = [];
        for (var i = 0; i < arrToConvert.length; i++) {
            newArr = newArr.concat(arrToConvert[i]);
        }
        return newArr;
    }

    findRecursive(arr1, toFind) {
        return arr1.find(val => Array.isArray(val) ? findRecursive(val, toFind) : val === toFind) !== undefined;
    }

    pick(matrix, col) {
        var column = [];
        for (var i = 0; i < matrix.length; i++) {
            column.push(matrix[i][col]);
        }
        return column;
    }

    ContainsinArray(arr, check) {
        var found = false;
        for (var i = 0; i < check.length; i++) {
            if (arr.indexOf(check[i]) > -1) {
                found = true;
                break;
            }
        }
        return found;
    }

    findOne(haystack, arr) {
        return arr.some(function (v) {
            return haystack.indexOf(v) >= 0;
        });
    };

    unique(data) {
        let process = (names) => names.filter((v, i) => names.indexOf(v) === i)
        return process(data)
    }

    containsInArray(arr, check) {
        let found = false;
        for (let i = 0; i < check.length; i++) {
            if (arr.indexOf(check[i]) > -1) {
                found = true;
                break;
            }
        }
        return found;
    }

};
