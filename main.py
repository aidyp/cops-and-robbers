from types import new_class
import networkx as nx
import numpy
import pygame

BLUE = (0, 0, 255)


def create_planar_graph(n, p):
    planar = False
    while planar == False:
        g = nx.erdos_renyi_graph(n, p)
        planar = nx.check_planarity(g)[0]
    return g 

def generate_layout(G, scale_factor, game_dimensions):
    layout = nx.planar_layout(G)
    # Scale by factor 
    scaled_layout = nx.rescale_layout_dict(layout, scale_factor)
    # translate to pygame co-ordinates
    for node in scaled_layout:
        scaled_layout[node] = screen_scale(scaled_layout[node], game_dimensions)
    return scaled_layout

def screen_scale(pos, game_dimensions):
    '''
    networkx scales as 0,0 at centre, pygame has 0,0 in top right corner
    '''
    new_pos = (pos[0] + game_dimensions[0] / 2, pos[1] + game_dimensions[1] / 2)
    return new_pos


def draw_nodes(node_layout, screen):
    # Draw a circle with centre defined by the node_layout
    for node in node_layout:
        pos = node_layout[node]
        # Positions need to be translated to pygame co-ordinates
        pygame.draw.circle(screen, BLUE, pos, 5)

def draw_edges(G, node_layout, screen):
    '''
    Draw a line between each node according to the edges
    '''
    for edge in G.edges:        
        # draw a line between the two centres
        left, right = edge[0], edge[1]
        pygame.draw.line(screen, BLUE, node_layout[left], node_layout[right])



def draw_new_graph(n, p, scale, screen_size):
    G = create_planar_graph(n, p)
    layout = generate_layout(G, scale, screen_size)
    draw_nodes(layout, screen)
    draw_edges(G, layout, screen)



pygame.init()
size = (700, 500)
scale = 275
screen = pygame.display.set_mode(size)
pygame.display.set_caption("Cops and Robbers")
draw_new_graph(12, 0.5, scale, size)
running = True
while running:

    for event in pygame.event.get():

        if event.type == pygame.KEYDOWN:
            screen.fill((0,0,0))
            draw_new_graph(12, 0.5, scale, size)

        if event.type == pygame.QUIT:
            running = False

    pygame.display.update()
# while True:
#     pygame.display.update()

# pygame.quit()
# quit()

