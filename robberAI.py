'''
Simple algorithms to decide how the robber will move
'''
import networkx as nx

def move_robber(cop, robber, G):
    '''
    Given the node of the cop, the node of the robber, a graph, resolve the robber's next move
    Notice the robber will always move 'first', that is, the cop will know where the robber is about to go
    '''

    # Get the list of possible 'moves'
    neighbours = G.adj[robber]

    # Of these nodes, choose the one that is furthest from where the cop currently is
    furthest_node = robber 
    furthest_distance = 0

    for n in neighbours:
        cop_target_distance = len(nx.shortest_path(G, cop, n))
        if cop_target_distance > furthest_distance:
            furthest_node = n 
            furthest_distance = cop_target_distance
    
    robber_target_node = furthest_node
    return robber_target_node





