module.exports = new class SysFunctions {
    constructor() {       
    }
  
    randomchoice(A){
       return A[Math.floor(Math.random() * A.length)];
    }

    inArray(key,A){
        if(A[key] != undefined && A[key] != null && A[key].length > 0){
            return true;
        }
        return false;
    }

    len(A){
        return A.length;
    }

    NotcontainsinArray(A,value) {
        return A.indexOf(value) < 0;
    }

    sort(A){
        var uniqueNames = A.filter(function(item, pos) {
            return A.indexOf(item) == pos;
        });
        return uniqueNames;
    }    

    isNotInArray(value, array) {
        return !array.indexOf(value) > -1;
    }

    NotcontainsinPattern_words(A,value) {
        var otp = false;
        for (var i = 0; i < A.length; i++) {
        	for (var ii = 0; ii < A[i].length; ii++) {
            	if(A[i][ii] == value){
                	otp = true;
                }
            }         
        }
        return otp;
    }

    multiDimensionalUnique(arr) {
        var uniques = [];
        var itemsFound = {};
        for(var i = 0, l = arr.length; i < l; i++) {
            var stringified = JSON.stringify(arr[i]);
            if(itemsFound[stringified]) { continue; }
            uniques.push(arr[i]);
            itemsFound[stringified] = true;
        }
        return uniques;
    }

};