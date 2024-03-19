import {Circle} from "./circle.js";

class AABB{
    constructor(size){
        this.position = [0,0];
        this.size = size;
        this.debugObjects = [];
    }

    CheckCollider(other){
        if(other instanceof Circle){
            return this.CheckColliderCircle(other);
        }

        else if(other instanceof AABB){
            return this.CheckColliderAABB(other);
        }
    }

    CheckColliderAABB(other){
        if(this.position[0] - this.size[0]/2 <= other.position[0] + other.size[0]/2 &&
        this.position[0] + this.size[0]/2 >= other.position[0] - other.size[0]/2 &&
        this.position[1] - this.size[1]/2 <= other.position[1] + other.size[1]/2 &&
        this.position[1] + this.size[1]/2 >= other.position[1] - other.size[1]/2)
            return true;

        return false;
    }

    CheckColliderCircle(other){
        let closest = [other.position[0] - this.position[0], other.position[1] - this.position[1]];
        closest[0] = Math.min(Math.max(closest[0], -this.size[0]/2), this.size[0]/2);
        closest[1] = Math.min(Math.max(closest[1], -this.size[1]/2), this.size[1]/2);

        closest[0] = closest[0] + this.position[0];
        closest[1] = closest[1] + this.position[1];
        //console.log(closest[0] + " " + closest[1]);
        let dir = [closest[0] - other.position[0], closest[1] - other.position[1]];

        let distance = Math.abs(dir[0]*dir[0] + dir[1]*dir[1]);

        //console.log(distance + " " + other.radius);//dir[0] + " " + dir[1]);
        if(distance < Math.pow(other.radius, 2)){
            return true;
        }

        return false;
    }

    CheckPoint(point){
        if(point[0] < this.position[0] + this.size[0]/2 && point[0] > this.position[0] - this.size[0]/2){
            if(point[1] < this.position[1] + this.size[1]/2 && point[1] > this.position[1] - this.size[1]/2){
                return true;
            }   
        }

        return false;
    }
}

export{AABB}