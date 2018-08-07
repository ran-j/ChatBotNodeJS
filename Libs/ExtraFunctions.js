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
};