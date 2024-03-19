import {AABB} from "./aabb.js";

class Circle{
    constructor(radius){
        this.position = [0,0];
        this.radius = radius;
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
        let closest = [this.position[0] - other.position[0], this.position[1] - other.position[1]];
        closest[0] = Math.min(Math.max(closest[0], -other.size[0]/2), other.size[0]/2);
        closest[1] = Math.min(Math.max(closest[1], -other.size[1]/2), other.size[1]/2);

        let distance = (closest[0] - this.position[0]) + (closest[1] - this.position[1]);
        if(distance < Math.pow(this.radius, 2))
            return true;

        return false;
    }

    CheckColliderCircle(other){
        let xDiff = other.position[0] - this.position[0];
        let yDiff = other.position[1] - this.position[1];
        let distance = xDiff*xDiff + yDiff*yDiff;
        if(distance <= Math.pow(other.radius + this.radius, 2)){
            return true;
        }

        return false;
    }

    CheckPoint(point){
        let distance = (point[0] - this.position[0]) + (point[1] - this.position[1]);
        if(distance <= Math.pow(this.radius, 2))
            return true;

        return false;
    }
}

export{Circle}