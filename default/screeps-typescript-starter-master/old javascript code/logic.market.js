/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('logic.market');
 * mod.thing == 'a thing'; // true
 */

var logicMarket = {
    run: function() {
        //if(Game.time % 100 != 0) return;
        
        //return;
        //672,397
        sellToABuyOrder();
        //createASellOrder();
    }
};

var sellToABuyOrder = function() {
    var minimumAmountToSell = 5000;
    var maximumAmountOfCost = 30000;
    var minimumResToLeaveInTerm = [1000, 50000]
    var resourcesForBuyOrders = [RESOURCE_ZYNTHIUM, RESOURCE_ENERGY];
    var minimumPriceToBuyFor = [0.18, 0.02];
    
    for(var res = 0; res < resourcesForBuyOrders.length; res ++)
    {
        var buyOrders = Game.market.getAllOrders({resourceType: resourcesForBuyOrders[res], type: ORDER_BUY})
        if(buyOrders.length == 0) continue
        buyOrders = buyOrders.sort(function(a, b) {return b.price - a.price})
        var orderToBuy = buyOrders[0];
        if(orderToBuy.price < minimumPriceToBuyFor[res]) continue;
        //console.log(JSON.stringify(orderToBuy))
        
        //console.log("***")
        for(var i = 0; i < buyOrders.length; i ++)
        {
            //console.log(JSON.stringify(buyOrders[i]))
            //console.log(buyOrders[i].id + " " + buyOrders[i].price + " " + buyOrders[i].resourceType)
        }
        //console.log("---")
        
        let myRooms = _.filter(Game.rooms, r => r.controller && r.controller.my && r.terminal && r.terminal.my);
        for(var id in myRooms) 
        {
            var room = myRooms[id];
            var terminal = room.terminal;
            var amountToBuy = terminal.store[resourcesForBuyOrders[res]] - minimumResToLeaveInTerm[res] < orderToBuy.remainingAmount 
                ? (terminal.store[resourcesForBuyOrders[res]] - minimumResToLeaveInTerm[res]) 
                : orderToBuy.remainingAmount;
            var transforEnergyCost = Game.market.calcTransactionCost(amountToBuy, room.name, orderToBuy.roomName);
            var resourceRemaining = terminal.store[resourcesForBuyOrders[res]] - amountToBuy - (resourcesForBuyOrders[res] == RESOURCE_ENERGY ? transforEnergyCost : 0);
            
            if(resourceRemaining <= minimumResToLeaveInTerm[res] || amountToBuy <= 0 || transforEnergyCost > terminal.store[RESOURCE_ENERGY]) continue;
            
            if(terminal && !terminal.cooldown) 
            {
                console.log("Selling " + (amountToBuy) + " " + resourcesForBuyOrders[res] + " for price: " + orderToBuy.price + " Transaction cost: " + transforEnergyCost)
                console.log(Game.market.deal(orderToBuy.id, amountToBuy, room.name))
            }
        }
    }
}

var createASellOrder = function() {
    var minimumAmountToSell = 5000;
    var maximumAmountOfCost = 30000;
    var firstOrderPrice = -1;
    var priceToSellFor = [0.499]
    var minimumResToLeaveInTerm = [//5000, 
                                    80000]
    var resourcesForBuyOrders = [//RESOURCE_ZYNTHIUM, 
                            RESOURCE_ENERGY];
    
    for(var res = 0; res < resourcesForBuyOrders.length; res ++)
    {
        var buyOrders = Game.market.getAllOrders({resourceType: resourcesForBuyOrders[res], type: ORDER_BUY})
        buyOrders = buyOrders.sort(function(a, b) {return a.price < b.price})
        
        
        //console.log("***")
        for(var i = 0; i < buyOrders.length; i ++)
        {
            console.log(buyOrders[i].id + " " + buyOrders[i].price )
        }
        console.log("---")
        
        let myRooms = _.filter(Game.rooms, r => r.controller && r.controller.my);
        _.forEach(myRooms, function(room) 
        {
            //console.log("iterate rooms")
            var terminal = room.terminal;
            var amountToBuy = terminal.store[resourcesForBuyOrders[res]] / 2;
            var resourceRemaining = terminal.store[resourcesForBuyOrders[res]] - amountToBuy;
            
            //console.log(resourcesForBuyOrders[res])
            //console.log(amountToBuy)
            //console.log(resourceRemaining)
            //console.log(buyOrders.length)
            
            for(var i = 0; i < buyOrders.length && resourceRemaining >= minimumResToLeaveInTerm[res]; i ++)
            {
                //console.log("iterate orders")
                firstOrderPrice = firstOrderPrice == -1 ? buyOrders[i].price : firstOrderPrice;
                const transforEnergyCost = Game.market.calcTransactionCost(amountToBuy, room.name, buyOrders[i].roomName);
                //console.log(transforEnergyCost + " " + buyOrders[i].price)
                if(transforEnergyCost > maximumAmountOfCost || buyOrders[i].price < firstOrderPrice * 0.90) continue;
                
                //console.log("---")
                //return;
                
                //console.log("ready to sell")
                
                if(terminal && !terminal.cooldown) 
                {
                    console.log("Selling " + (amountToBuy) + resourcesForBuyOrders[res] + " for price: " + buyOrders[i].price + " Transaction cost: " + transforEnergyCost)
                    //console.log(Game.market.deal(buyOrders[i].id, amountToBuy, room.name))
                    break;
                }
            }
        })
    }
}


module.exports = logicMarket;