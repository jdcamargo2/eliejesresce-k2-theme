#include <stdio.h>
#include <stddef.h>

#define DIMENSION 2

typedef struct {
    double real;
    double imaginary;
} Complex;

static double probability(const Complex *value) {
    return value->real * value->real +
           value->imaginary * value->imaginary;
}

int main(void) {
    Complex state[DIMENSION] = {
        {1.0, 0.0},
        {0.0, 0.0}
    };

    printf("%f\n", probability(&state[0]));
    return 0;
}