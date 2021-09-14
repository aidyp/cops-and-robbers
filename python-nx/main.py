from types import new_class
import networkx as nx
import numpy
import pygame
from robberAI import move_robber

# Lazy for now, have some globals for dimensions
BLUE = (0, 0, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BACKGROUND = (0, 0, 0)
SCREENSIZE = [700, 500]



class CRGraph:


    def __init__(self, n, p, scale, surface):
        # Call new_graph to make a new one
        self.G = None 
        self.layout = None
        self.n = n 
        self.p = p
        self.scale = scale 
        self.surface = surface
        self.cops = [0] # For now just do first and last node
        self.robbers = [9] # For now just do first and laast node

    def _initialise_planar_graph(self):
        planar = False
        while planar == False:
            g = nx.erdos_renyi_graph(self.n, self.p)
            planar = nx.check_planarity(g)[0]
        return g 

    

    def clear_graph(self):
        '''
        Clears the screen, sets graph to the empty graph
        '''
        self.surface.fill(BACKGROUND)
        self.G = None
        
    def draw_graph(self):
        '''
        Draws the current graph, cops, and robbers, onto the surface
        '''
        self._draw_nodes(BLUE)
        self._draw_edges(BLUE)
        self._draw_cops(GREEN)
        self._draw_robbers(RED)
    
    def _draw_nodes(self, colour):
        for node in self.layout:
            pos = self.layout[node]
            pygame.draw.circle(self.surface, BLUE, pos, 5)

    def _draw_edges(self, colour):
        for edge in self.G.edges:
            left, right = edge[0], edge[1]
            pygame.draw.line(self.surface, BLUE, self.layout[left], self.layout[right])

    def _draw_cops(self, colour):
        '''
        Draw the location of any cops on the graph
        '''
        for cop in self.cops:
            pos = self.layout[cop]
            pygame.draw.circle(self.surface, colour, pos, 5)

    def _draw_robbers(self, colour):
        '''
        Draw the location of any robbers on the graph
        '''
        for robber in self.robbers:
            pos = self.layout[robber]
            pygame.draw.circle(self.surface, colour, pos, 5)


    def _generate_layout(self):
        layout = nx.planar_layout(self.G)
        # Scale by factor 
        scaled_layout = nx.rescale_layout_dict(layout, self.scale)
        # translate to pygame co-ordinates
        for node in scaled_layout:
            scaled_layout[node] = self._screen_scale(scaled_layout[node])
        return scaled_layout

    def _screen_scale(self, pos):
        '''
        networkx scales as 0,0 at centre, pygame has 0,0 in top right corner
        '''
        new_pos = (pos[0] + SCREENSIZE[0] / 2, pos[1] + SCREENSIZE[1] / 2)
        return new_pos


    def paint_new_graph(self):
        self.clear_graph()
        self.G = self._initialise_planar_graph()
        self.layout = self._generate_layout()
        self.cops = [0]
        self.robbers = [9]
        self.draw_graph()
        pygame.display.set_caption("Cops and Robbers")

    def _clicked_node(self, click_pos):
        '''
        Check if a node has been clicked
        Returns the node if clicked
        Returns -1 if no node has been clicked
        '''

        for node in self.G.nodes:
            # Get centre of node on the screen 
            node_centre = self.layout[node]
            # Calculate distance between node and click 
            distance = (node_centre[0] - click_pos[0])**2 + (node_centre[1] - click_pos[1])**2
            # Radius of the node is 5, will need to fix this later if want to resize the nodes 
            if distance <= 25:
                return node 

        return -1

    def _make_move(self, cop_move):

        # Get the robbers next move
        robber_move = move_robber(self.cops[0], self.robbers[0], self.G)
        self.robbers[0] = robber_move

        # Move the cop 
        self.cops[0] = cop_move

        # Check positions 
        if self.robbers[0] == self.cops[0]:
            return True 
        return False 


    def handle_click(self, click_pos):
        '''
        Click handler for the game
        '''

        # Detect if a node has been clicked
        clicked = self._clicked_node(click_pos)
        if clicked == -1:
            return 
        # Is that node a neighbour of the cop? 
        if clicked in self.G[self.cops[0]]:
            won = self._make_move(clicked)
        else:
            return
        
        if won: 
            pygame.display.set_caption("You caught the robber!")
        
        self.draw_graph()


pygame.init()
size = (700, 500)
scale = 275
screen = pygame.display.set_mode(size)
pygame.display.set_caption("Cops and Robbers")
GraphContainer = CRGraph(10, 0.4, scale, screen)
GraphContainer.paint_new_graph()
running = True
while running:

    for event in pygame.event.get():

        if event.type == pygame.KEYDOWN:
            GraphContainer.paint_new_graph()

        if event.type == pygame.MOUSEBUTTONDOWN:
            pos = pygame.mouse.get_pos()
            GraphContainer.handle_click(pos)

        if event.type == pygame.QUIT:
            running = False

    pygame.display.update()
# while True:
#     pygame.display.update()

# pygame.quit()
# quit()

