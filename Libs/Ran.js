if(!Array.prototype.Last){
    Array.prototype.Last = function(){
        return this.slice(-1)[0];
    }
}

if(!Array.prototype.First){
    Array.prototype.First = function(){
        return this[0];
    }
}

if(!Array.prototype.sorted){//sort
    Array.prototype.sorted = function(){
        let arr = this;
        return arr.filter(function(item, pos) {
            return arr.indexOf(item) == pos;
        });
    }
}

if(!Array.prototype.One){ //multiDimensionalUnique
    Array.prototype.One = function(){
        var newArr = [];
        for(var i = 0; i < this.length; i++){
            newArr = newArr.concat(this[i]);
        }
        return newArr;
    }
}

if(!Array.prototype.Pick){
    Array.prototype.Pick = function(col){
        var column = [];
        for(var i=0; i<this.length; i++){
           column.push(this[i][col]);
        }
        return column;
    }
}

if(!Array.prototype.Random){ 
    Array.prototype.Random = function(){     
        return this[Math.floor(Math.random()*this.length)]
    }
}

if(!String.prototype.ReplaceAll){  
    String.prototype.ReplaceAll = function(search, replacement){      
        let target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    }
}
