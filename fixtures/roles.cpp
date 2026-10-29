#include <string>
#include <cstddef>
#define LIMIT 4
#if LIMIT > 0
struct State { const int id; int value; };
enum class Mode { Ready, Waiting };
static int evaluate(const State& state, int parameter) {
    const int ordinary = parameter;
    const char* empty = nullptr;
    void* legacy = NULL;
    return state.value + ordinary + (empty == legacy ? 0 : LIMIT);
}
#endif
